import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { Tasks } from './entities/tasks.entity';
import { User } from './entities/user.entity';
import { RepoStat } from './entities/repoStat.entity';
import { Anomaly } from './entities/anomaly.entity';
import { HtmlCopyCheck } from './entities/htmlCopyCheck.entity';
import { HtmlCopyMatch } from './entities/htmlCopyMatch.entity';
import * as path from 'path';
import * as levenshtein from 'fast-levenshtein';
import pLimit from 'p-limit';
import { ParticipatingGithubUser } from './entities/participants.entity';

interface commit {
    hash: string;
    authorName: string;
    authorEmail: string;
    authorDate: Date;
    additions: number;
    deletions: number;
}

type commits = commit[]

@Injectable()
export class GitSyncService {
    private readonly logger = new Logger(GitSyncService.name);
    private isWindows = process.platform === 'win32';
    private readonly basePath = this.isWindows
        ? path.join('C:\\', 'tmp', 'repos')
        : path.resolve('/', 'tmp', 'repos');

    constructor(
        @InjectRepository(Tasks) private readonly taskRepo: Repository<Tasks>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(RepoStat) private readonly statRepo: Repository<RepoStat>,
        @InjectRepository(Anomaly) private readonly anomalyRepo: Repository<Anomaly>,
        @InjectRepository(HtmlCopyCheck) private readonly htmlCopyCheckRepo: Repository<HtmlCopyCheck>,
        @InjectRepository(HtmlCopyMatch) private readonly htmlCopyMatchRepo: Repository<HtmlCopyMatch>,
        @InjectRepository(ParticipatingGithubUser) private readonly participantRepo: Repository<ParticipatingGithubUser>
    ) { }

    @Cron('*/30 * * * *')
    async handleCron() {
        this.logger.log('Starting GitHub cron job...');

        const tasks = await this.taskRepo.find();
        const users = await this.userRepo.find();

        for (const task of tasks) {
            try {
                const taskPath = `${this.basePath}/${task.taskId}/${task.branch}`;
                this.cloneOrUpdateRepos(task.taskId, taskPath, task.branch);
                console.log('cloning repositories ended')
                await this.analyzeRepos(task, taskPath, users);
            } catch (err) {
                this.logger.error(`Error processing task ${task.taskId}`, err);
            }
        }

        this.logger.log('GitHub cron job completed.');
    }

    @Cron('1 */6 * * *')
    async detectAnomalies() {
        this.logger.log('Запущен анализ аномалий...');

        const users = await this.statRepo
            .createQueryBuilder('stat')
            .select('DISTINCT stat.githubLogin', 'githubLogin')
            .getRawMany();

        for (const { githubLogin, commitHash } of users) {
            const stats = await this.statRepo.find({
                where: { githubLogin },
                relations: ['task'],
                order: { commitDate: 'ASC' },
            });

            if (stats.length < 3) continue;

            const totalActivity = stats.map(s => s.additions + s.deletions);
            const avg = totalActivity.reduce((a, b) => a + b, 0) / totalActivity.length;

            const threshold = avg * 3;

            for (const s of stats) {
                const activity = s.additions + s.deletions;
                console.log(s.commitHash)
                if (activity > threshold) {
                    const exists = await this.anomalyRepo.findOne({
                        where: { githubLogin: s.githubLogin, commitDate: s.commitDate },
                    });

                    if (!exists) {
                        const anomaly = this.anomalyRepo.create({
                            githubLogin: s.githubLogin,
                            commitDate: s.commitDate,
                            task: s.task,
                            commitHash: s.commitHash
                        });
                        await this.anomalyRepo.save(anomaly);
                        this.logger.warn(`Аномалия для ${s.githubLogin} по заданию "${s.task.name}" на ${s.commitDate}`);
                    }
                }
            }
        }

        this.logger.log('Анализ аномалий завершён.');
    }

    private async cloneOrUpdateRepos(taskId: number, targetDir: string, branch: string = 'main') {
        const execSyncWithRetry = (
            cmd: string,
            options: { cwd?: string; stdio?: any; encoding?: BufferEncoding } = {},
            retries = 3,
            delayMs = 1000,
        ): string => {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const result: Buffer | string = execSync(cmd, options);

                    if (typeof result === 'string') {
                        return result;
                    }

                    if (Buffer.isBuffer(result)) {
                        return result.toString('utf8');
                    }

                    return String(result);
                } catch (err: any) {
                    if (attempt === retries) {
                        throw err;
                    }
                    this.logger.warn(`Попытка ${attempt} команды "${cmd}" не удалась. Повтор через ${delayMs} мс`);
                    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
                }
            }
            throw new Error('Unexpected error in execSyncWithRetry');
        };

        try {
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            this.logger.log(`Cloning repos for assignment ${taskId} into ${targetDir} (branch: ${branch})`);

            try {
                execSyncWithRetry(`gh classroom clone student-repos --assignment-id ${taskId}`, {
                    cwd: targetDir,
                    stdio: 'inherit',
                });
            } catch (cloneErr: any) {
                this.logger.warn(`Ошибка при клонировании репозиториев: ${cloneErr.message}`);
                return;
            }

            let taskDirs: fs.Dirent[];
            try {
                taskDirs = fs.readdirSync(targetDir, { withFileTypes: true }).filter(d => d.isDirectory());
            } catch (readDirErr: any) {
                this.logger.warn(`Ошибка при чтении каталогов заданий: ${readDirErr.message}`);
                return;
            }

            const limit = pLimit(1);
            const tasks: Promise<void>[] = [];

            for (const taskDir of taskDirs) {
                const taskPath = path.join(targetDir, taskDir.name);
                let userDirs: fs.Dirent[];

                try {
                    userDirs = fs.readdirSync(taskPath, { withFileTypes: true }).filter(d => d.isDirectory());
                } catch (err: any) {
                    this.logger.warn(`Ошибка при чтении подкаталогов: ${taskPath}: ${err.message}`);
                    continue;
                }

                for (const userDir of userDirs) {
                    const repoPath = path.join(taskPath, userDir.name);

                    if (!fs.existsSync(path.join(repoPath, '.git'))) {
                        this.logger.warn(`Пропущено: ${repoPath} не является git-репозиторием`);
                        continue;
                    }

                    tasks.push(limit(async () => {
                        try {
                            const currentBranch = execSyncWithRetry('git rev-parse --abbrev-ref HEAD', {
                                cwd: repoPath,
                                encoding: 'utf8',
                            }).trim();

                            if (currentBranch === branch) {
                                this.logger.log(`${repoPath} уже на ветке ${branch}, переключение не требуется`);
                                execSyncWithRetry(`git pull origin ${branch}`, { cwd: repoPath, stdio: 'inherit' });
                                return;
                            }

                            this.logger.log(`Switching ${repoPath} to branch "${branch}"`);

                            execSyncWithRetry(`git fetch`, { cwd: repoPath, stdio: 'inherit' });
                            execSyncWithRetry(`git checkout ${branch}`, { cwd: repoPath, stdio: 'inherit' });
                            execSyncWithRetry(`git pull origin ${branch}`, { cwd: repoPath, stdio: 'inherit' });

                        } catch (e: any) {
                            this.logger.warn(`Ошибка при переключении ветки в ${repoPath}: ${e.message}`);
                        }
                    }));
                }
            }

            await Promise.all(tasks);

        } catch (err: any) {
            this.logger.error('Failed to clone or update repos', err.message ?? err);
        }
    }


    private async analyzeRepos(task: Tasks, dir: string, users: User[]) {
        const level1Dirs = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());

        for (const level1 of level1Dirs) {
            const level1Path = `${dir}/${level1.name}`;
            const repoDirs = fs.readdirSync(level1Path, { withFileTypes: true }).filter(d => d.isDirectory());

            for (const repoDir of repoDirs) {
                const repoPath = `${level1Path}/${repoDir.name}`;

                if (!fs.existsSync(`${repoPath}/.git`)) {
                    this.logger.warn(`Пропущено: ${repoPath} не является git-репозиторием`);
                    continue;
                }

                this.logger.log(`Анализ репозитория: ${repoPath}`);

                let rawLog: string;
                try {
                    rawLog = execSync(
                        `git log --pretty=format:"%H|%an|%ae|%ad" --numstat`,
                        { cwd: repoPath, encoding: 'utf8' }
                    );
                } catch (err) {
                    this.logger.error(`Ошибка при git log в ${repoPath}`, err);
                    continue;
                }

                const commits: commits = this.parseGitLog(rawLog);

                for (const commit of commits) {
                    const githubLogin = commit.authorEmail.split('@')[0];

                    const exists = await this.statRepo.findOne({ where: { commitHash: commit.hash } });
                    if (exists) {
                        this.logger.debug(`Коммит ${commit.hash} уже в базе, пропускаем`);
                        continue;
                    }

                    const stat = this.statRepo.create({
                        githubLogin,
                        task,
                        commitHash: commit.hash,
                        commitDate: commit.authorDate,
                        additions: commit.additions,
                        deletions: commit.deletions,
                    });

                    await this.statRepo.save(stat);
                    this.logger.log(`Сохранён коммит ${commit.hash} от ${githubLogin}`);
                }
            }
        }
    }


    private parseGitLog(rawLog: string) {
        const commits: commits = [];
        const lines = rawLog.split('\n');
        let currentCommit: commit | null = null;

        for (const line of lines) {
            if (line.includes('|')) {
                if (currentCommit) commits.push(currentCommit);
                const [hash, authorName, authorEmail, authorDate] = line.split('|');
                currentCommit = {
                    hash,
                    authorName,
                    authorEmail,
                    authorDate: new Date(authorDate),
                    additions: 0,
                    deletions: 0,
                };
            } else if (line.trim() === '') {
            } else {
                const parts = line.trim().split('\t');
                if (parts.length >= 2 && currentCommit) {
                    const add = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
                    const del = parts[1] === '-' ? 0 : parseInt(parts[1], 10);

                    if (currentCommit) {
                        currentCommit.additions += isNaN(add) ? 0 : add;
                        currentCommit.deletions += isNaN(del) ? 0 : del;
                    }
                }
            }
        }

        if (currentCommit) commits.push(currentCommit);
        return commits;
    }

    @Cron('40 */6 * * *')
    async handleHtmlComparisonCron() {
        const excludedFiles = ['normalize.css', 'reset.css', 'README.md'];
        const limit = pLimit(2);

        this.logger.log('Starting HTML/CSS/JS copy comparison cron job...');

        const checks = await this.htmlCopyCheckRepo.find({
            where: { enabled: true },
            relations: ['task'],
        });
        const enabledChecks = checks.filter(c => c.enabled);

        await this.htmlCopyMatchRepo
            .createQueryBuilder()
            .delete()
            .where('similarityPercent < :threshold', { threshold: 80 })
            .execute();

        for (const check of enabledChecks) {
            const task = check.task;
            const branchDir = path.join(this.basePath, String(task.taskId), task.branch);

            if (!fs.existsSync(branchDir)) {
                this.logger.warn(`Branch directory ${branchDir} does not exist, skipping task ${task.taskId}`);
                continue;
            }

            this.logger.log(`Processing task ${task.taskId} branch "${task.branch}" in directory ${branchDir}`);

            const submissionDirs = fs.readdirSync(branchDir, { withFileTypes: true })
                .filter(d => d.isDirectory() && d.name.endsWith('-submissions'));

            const filesByExtension: Record<string, Record<string, Record<string, string>>> = {
                html: {}, css: {}, js: {}, ts: {}
            };

            for (const submissionDir of submissionDirs) {
                const submissionPath = path.join(branchDir, submissionDir.name);
                const userDirs = fs.readdirSync(submissionPath, { withFileTypes: true }).filter(d => d.isDirectory());

                for (const userDir of userDirs) {
                    const userRepoPath = path.join(submissionPath, userDir.name);

                    const loginParts = userDir.name.split('-');
                    const githubLogin = loginParts[loginParts.length - 1];

                    const allFiles = this.getFilesByExtensions(userRepoPath, ['.html', '.css', '.js', '.ts']);

                    for (const filePath of allFiles) {
                        const ext = path.extname(filePath).slice(1);
                        const fileName = path.basename(filePath);
                        if (excludedFiles.includes(fileName)) continue;

                        const content = fs.readFileSync(filePath, 'utf-8');

                        if (!filesByExtension[ext][fileName]) {
                            filesByExtension[ext][fileName] = {};
                        }

                        filesByExtension[ext][fileName][githubLogin] = content;
                    }
                }
            }

            const allComparisons: Promise<void>[] = [];

            for (const [ext, files] of Object.entries(filesByExtension)) {
                for (const [fileName, userContents] of Object.entries(files)) {
                    const users = Object.keys(userContents);

                    for (let i = 0; i < users.length; i++) {
                        for (let j = i + 1; j < users.length; j++) {
                            const user1 = users[i];
                            const user2 = users[j];
                            const content1 = userContents[user1];
                            const content2 = userContents[user2];

                            allComparisons.push(
                                limit(async () => {
                                    this.logger.log(`Comparing ${ext.toUpperCase()} file "${fileName}" between "${user1}" and "${user2}"`);

                                    const similarityPercent = this.calculateSimilarityPercent(content1, content2);
                                    this.logger.log(`Similarity: ${similarityPercent.toFixed(2)}%`);

                                    const duplicate = await this.htmlCopyMatchRepo.findOne({
                                        where: {
                                            task: { id: task.taskId },
                                            githubLogin1: user1,
                                            githubLogin2: user2,
                                            filename: fileName,
                                            similarityPercent,
                                        },
                                        relations: ['task'],
                                    });

                                    if (!duplicate) {
                                        await this.saveHtmlCopyResult(task, fileName, user1, user2, similarityPercent);
                                    } else {
                                        this.logger.log(`Duplicate match found — skipping save for ${fileName} between ${user1} and ${user2}`);
                                    }
                                })
                            );
                        }
                    }
                }
            }

            await Promise.all(allComparisons);
        }

        this.logger.log('All file-type comparisons completed.');

        await this.htmlCopyMatchRepo
            .createQueryBuilder()
            .delete()
            .where('similarityPercent < :threshold', { threshold: 80 })
            .execute();

        this.logger.log('Deleted entries with <80% similarity.');

        const matches = await this.htmlCopyMatchRepo.find({
            select: ['githubLogin1', 'githubLogin2', 'similarityPercent', 'filename', 'detectedAt'],
            where: { similarityPercent: MoreThanOrEqual(80) },
        });

        const allUsers = new Set<string>();
        matches.forEach(m => {
            allUsers.add(m.githubLogin1);
            allUsers.add(m.githubLogin2);
        });

        this.logger.log(`Users with similarity >=80%: ${[...allUsers].join(', ')}`);
    }


    getFilesByExtensions(dir: string, extensions: string[]): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);

        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat && stat.isDirectory()) {
                results = results.concat(this.getFilesByExtensions(filePath, extensions));
            } else if (extensions.includes(path.extname(file))) {
                results.push(filePath);
            }
        }

        return results;
    }

    private calculateSimilarityPercent(a: string, b: string): number {
        const distance = levenshtein.get(a, b);
        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 100;
        return ((maxLen - distance) / maxLen) * 100;
    }

    private async saveHtmlCopyResult(
        task: Tasks,
        filename: string,
        githubLogin1: string,
        githubLogin2: string,
        similarityPercent: number,
    ) {
        const match = this.htmlCopyMatchRepo.create({
            task,
            filename,
            githubLogin1,
            githubLogin2,
            similarityPercent,
            detectedAt: new Date(),
        });
        await this.htmlCopyMatchRepo.save(match);
    }

    @Cron('40 */3 * * *')
    async collectPaticipatingUsers() {
        const taskIds = fs.readdirSync(this.basePath);

        for (const taskId of taskIds) {
            const taskIdPath = path.join(this.basePath, taskId);
            if (!fs.statSync(taskIdPath).isDirectory()) continue;

            const taskBranches = fs.readdirSync(taskIdPath);

            for (const taskBranch of taskBranches) {
                const taskBranchPath = path.join(taskIdPath, taskBranch);
                if (!fs.statSync(taskBranchPath).isDirectory()) continue;

                const submissionFolders = fs.readdirSync(taskBranchPath);

                for (const submissionFolder of submissionFolders) {
                    const submissionFolderPath = path.join(taskBranchPath, submissionFolder);
                    if (!fs.statSync(submissionFolderPath).isDirectory()) continue;

                    let taskName = submissionFolder;
                    if (taskName.endsWith('-submissions')) {
                        taskName = taskName.replace(/-submissions$/, '');
                    }

                    const userDirs = fs.readdirSync(submissionFolderPath);

                    for (const userDir of userDirs) {
                        const userDirPath = path.join(submissionFolderPath, userDir);
                        if (!fs.statSync(userDirPath).isDirectory()) continue;

                        const githubLogin = userDir.split('-').pop();
                        if (!githubLogin || githubLogin.trim() === '') continue;

                        const exists = await this.participantRepo.findOne({
                            where: {
                                githubLogin,
                                taskId,
                                taskBranch,
                            },
                        });

                        if (!exists) {
                            const participant = this.participantRepo.create({
                                taskId,
                                taskBranch,
                                taskName,
                                githubLogin,
                            });

                            await this.participantRepo.save(participant);
                        }
                    }
                }
            }
        }
    }


    async onModuleInit() {
        // this.logger.log('GitSyncService initialized — запускаем синхронизацию сразу');
        // await this.handleCron();
        // this.logger.log('Начинаем поиск аномалий');
        await this.detectAnomalies();
        await this.handleHtmlComparisonCron();
        await this.collectPaticipatingUsers();
    }
}
