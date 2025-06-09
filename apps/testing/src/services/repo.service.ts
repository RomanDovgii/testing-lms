import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class RepoService {
  private isWindows = process.platform === 'win32';
  private baseReposPath = this.isWindows
    ? path.join('C:\\', 'tmp', 'repos')
    : path.resolve('/', 'tmp', 'repos');

  constructor() {
  }
  getRepoPath(taskId: number, taskName: string, githubLogin: string): string {
    return path.join(
      this.baseReposPath,
      String(taskId),
      taskName,
      `${taskName}-${githubLogin}`
    );
  }

  repoExists(taskId: number, taskName: string, githubLogin: string): boolean {
    const repoPath = this.getRepoPath(taskId, taskName, githubLogin);
    return fs.existsSync(repoPath) && fs.statSync(repoPath).isDirectory();
  }

  getHtmlFiles(taskId: number, taskName: string, githubLogin: string): string[] {
    const repoPath = this.getRepoPath(taskId, taskName, githubLogin);

    if (!this.repoExists(taskId, taskName, githubLogin)) {
      throw new Error(`Repository not found: ${repoPath}`);
    }

    const allFiles = fs.readdirSync(repoPath);
    return allFiles.filter(file => path.extname(file).toLowerCase() === '.html');
  }
}