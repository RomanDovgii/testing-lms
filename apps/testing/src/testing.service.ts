import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as parse5 from 'parse5';
import * as path from 'path';
import * as fsSync from 'fs';
import * as os from 'os';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { Tasks } from './entities/tasks.entity';
import { User } from './entities/user.entity';
import { TaskDto } from './dto/task.dto';
import { ValidationResult } from './entities/validation-results.entity';
import { Anomaly } from './entities/anomaly.entity';
import { HtmlCopyMatch } from './entities/htmlCopyMatch.entity';
import { Test } from './entities/test.entity';
import { TestResult } from './entities/test-result.entity';


@Injectable()
export class TestingService {
  constructor(
    @InjectRepository(Tasks)
    private taskRepository: Repository<Tasks>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Anomaly)
    private anomalyRepository: Repository<Anomaly>,
    @InjectRepository(HtmlCopyMatch)
    private copyRepository: Repository<HtmlCopyMatch>,
    @InjectRepository(ValidationResult)
    private readonly validationResultRepository: Repository<ValidationResult>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestResult)
    private readonly testResultRepository: Repository<TestResult>,
  ) { }

  private readonly logger = new Logger(TestingService.name);
  private baseRepoPath = path.resolve('../tmp/repos');

  async addTask(dto: TaskDto): Promise<Tasks> {
    const task = this.taskRepository.create({
      ...dto,
      owner: { id: dto.ownerId } as any
    });
    return await this.taskRepository.save(task);
  }

  async validateStudentRepo(githubLogin: string, taskId: number) {
    const task = await this.taskRepository.findOne({ where: { taskId } });
    if (!task) {
      throw new NotFoundException(`Task with id "${taskId}" not found`);
    }

    const branch = task.branch;
    const taskDir = path.join(this.baseRepoPath, String(task.taskId), branch);

    const topDirs = await fs.readdir(taskDir, { withFileTypes: true });
    const containerDir = topDirs.find(dir => dir.isDirectory());
    if (!containerDir) {
      throw new NotFoundException(`No subdirectory found in ${taskDir}`);
    }

    const containerPath = path.join(taskDir, containerDir.name);

    const submissionDirs = await fs.readdir(containerPath, { withFileTypes: true });
    const studentDirEntry = submissionDirs.find(
      dir => dir.isDirectory() && dir.name.endsWith(`-${githubLogin}`)
    );

    if (!studentDirEntry) {
      throw new NotFoundException(
        `No folder ending with -${githubLogin} found in ${containerPath}`
      );
    }

    const studentRepoPath = path.join(containerPath, studentDirEntry.name);

    console.log(studentRepoPath)

    try {
      await fs.access(studentRepoPath);
    } catch {
      throw new NotFoundException(`Student repo not found at ${studentRepoPath}`);
    }

    const htmlFiles = await this.getFilesByExtension(studentRepoPath, '.html');
    if (htmlFiles.length === 0) {
      return { message: 'No HTML files found in repository.' };
    }

    const results: {
      file: string;
      htmlValid: { isValid: boolean; errors: { message: string; line: number; col: number }[] };
      bemValid: { isValid: boolean; errors: string[] };
    }[] = [];

    const errors: { file: string; error: string }[] = [];

    let overallValid = true;

    for (const filePath of htmlFiles) {
      const content = await fs.readFile(filePath, 'utf-8');

      const htmlValid = this.validateHtmlSyntax(content);
      const bemValid = this.validateBemNamingAndNesting(content);

      if (!htmlValid.isValid || !bemValid.isValid) {
        overallValid = false;
      }

      if (!htmlValid.isValid) {
        errors.push({ file: path.basename(filePath), error: 'Invalid HTML syntax' });
      }

      if (!bemValid.isValid) {
        errors.push({ file: path.basename(filePath), error: 'BEM validation failed' });
      }

      results.push({
        file: path.relative(studentRepoPath, filePath),
        htmlValid,
        bemValid,
      });
    }

    const validationRecord = this.validationResultRepository.create({
      githubLogin,
      task,
      isValid: overallValid,
      errors: errors.length ? errors : null,
    });

    await this.validationResultRepository.save(validationRecord);

    return {
      taskId: task.taskId,
      githubLogin,
      overallValid,
      results,
      errors,
    };
  }


  private async getFilesByExtension(dir: string, ext: string): Promise<string[]> {
    let results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const nestedFiles = await this.getFilesByExtension(fullPath, ext);
        results = results.concat(nestedFiles);
      } else if (entry.isFile() && fullPath.endsWith(ext)) {
        results.push(fullPath);
      }
    }

    return results;
  }

  private validateHtmlSyntax(html: string): { isValid: boolean; errors: { message: string; line: number; col: number }[] } {
    const errors: { message: string; line: number; col: number }[] = [];
    let isValid = true;

    try {
      parse5.parse(html, { sourceCodeLocationInfo: true });
    } catch (e: any) {
      isValid = false;

      if (e && e.code === 'ERR_HTML_PARSER') {
        errors.push({
          message: e.message,
          line: e.lineNumber || 0,
          col: e.columnNumber || 0,
        });
      } else {
        errors.push({
          message: e.message || 'Unknown parse error',
          line: 0,
          col: 0,
        });
      }
    }

    return { isValid, errors };
  }

  private validateBemNamingAndNesting(html: string): { isValid: boolean; errors: string[] } {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    const bemClassRegex = /^([a-z0-9]+(?:-[a-z0-9]+)*)(__[a-z0-9]+(?:-[a-z0-9]+)*)?(--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;

    let isValid = true;
    const errors: string[] = [];

    $('[class]').each((_, el) => {
      const classList = $(el).attr('class')?.split(/\s+/) || [];
      for (const cls of classList) {
        if (!bemClassRegex.test(cls)) {
          isValid = false;
          const msg = `Invalid BEM class name found: "${cls}"`;
          this.logger.warn(msg);
          errors.push(msg);
        }
      }
    });

    $('[class]').each((_, el) => {
      const classList = $(el).attr('class')?.split(/\s+/) || [];
      classList.forEach(cls => {
        if (cls.includes('__')) {
          const [blockName] = cls.split('__');
          let parent = $(el).parent();
          let foundBlockParent = false;
          while (parent.length > 0 && parent[0].tagName !== 'html') {
            const parentClasses = parent.attr('class')?.split(/\s+/) || [];
            if (parentClasses.some(pc => pc === blockName || pc.startsWith(blockName + '--'))) {
              foundBlockParent = true;
              break;
            }
            parent = parent.parent();
          }
          if (!foundBlockParent) {
            isValid = false;
            const msg = `Element class "${cls}" is not nested inside block "${blockName}"`;
            this.logger.warn(msg);
            errors.push(msg);
          }
        }
      });
    });

    return { isValid, errors };
  }

  async getAnomalies() {
    return this.anomalyRepository.find({
      relations: ['task']
    })
  }

  async getCopies() {
    return this.copyRepository.find({
      relations: ['task']
    })
  }

  async runTestsForTestId(testId: number) {
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: ['tasks'],
    });

    if (!test) throw new Error(`Test with id=${testId} not found`);

    for (const task of test.tasks || []) {
      const submissionsRoot = path.join(this.baseRepoPath, String(task.id), 'rk-html-submissions');

      if (!fsSync.existsSync(submissionsRoot)) {
        this.logger.warn(`Submission folder not found: ${submissionsRoot}`);
        continue;
      }

      const studentDirs = await fs.readdir(submissionsRoot, { withFileTypes: true });

      for (const dir of studentDirs) {
        if (!dir.isDirectory()) continue;

        const folderName = dir.name;
        const githubLogin = this.extractGithubLogin(folderName);
        if (!githubLogin) continue;

        const studentRepoPath = path.join(submissionsRoot, folderName);
        const studentFilePath = path.join(studentRepoPath, test.filename);

        if (!fsSync.existsSync(studentFilePath)) {
          this.logger.warn(`File ${test.filename} not found for ${githubLogin}`);
          continue;
        }

        try {
          const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-run-'));
          const tempFilePath = path.join(tempDir, test.filename);
          await fs.copyFile(studentFilePath, tempFilePath);

          const testJsonContent = await fs.readFile(test.filepath, 'utf-8');
          const testJson = JSON.parse(testJsonContent);

          await this.appendExportsToFile(tempFilePath, testJson);

          const results = await this.runTests(tempFilePath, testJson);

          await this.saveTestResult(test, githubLogin, results);

          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (err) {
          this.logger.error(`Error processing ${githubLogin} in task ${task.id}: ${err.message}`);
        }
      }
    }
  }

  extractGithubLogin(folderName: string): string | null {
    const match = folderName.match(/-(\w+)$/);
    return match ? match[1] : null;
  }

  async appendExportsToFile(filePath: string, testJson: any[]) {
    const functionNames = new Set<string>();

    for (const file of testJson) {
      const tests = file.tests || file.test || [];
      for (const fnTest of tests) {
        functionNames.add(fnTest.function);
      }
    }

    const exportCode = `\n\nmodule.exports = { ${[...functionNames].join(', ')} };\n`;
    await fs.appendFile(filePath, exportCode);
  }

  async runTests(filePath: string, testJson: any[]) {
    delete require.cache[require.resolve(filePath)];
    const moduleFunctions = require(filePath);

    const results: {
      function: string;
      input?: any;
      expected?: any;
      output?: any;
      error?: string;
      passed?: boolean;
    }[] = [];

    for (const file of testJson) {
      const tests = file.tests || file.test || [];
      for (const fnTest of tests) {
        const fn = moduleFunctions[fnTest.function];

        if (!fn) {
          results.push({ function: fnTest.function, error: 'Function not found' });
          continue;
        }

        for (const testCase of fnTest.cases) {
          try {
            const result = Array.isArray(testCase.input)
              ? fn(...testCase.input)
              : fn(testCase.input);

            const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

            results.push({
              function: fnTest.function,
              input: testCase.input,
              expected: testCase.expected,
              output: result,
              passed,
            });
          } catch (err) {
            results.push({
              function: fnTest.function,
              input: testCase.input,
              expected: testCase.expected,
              error: err.message,
              passed: false,
            });
          }
        }
      }
    }

    return results;
  }

  async saveTestResult(test: Test, githubLogin: string, results: any) {
    const entity = this.testResultRepository.create({
      test,
      githubLogin,
      results,
    });
    await this.testResultRepository.save(entity);
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAndSaveTestResults(testId: number): Promise<any[]> {
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: ['tasks'],
    });

    if (!test) throw new Error('Test not found');
    if (!test.tasks || test.tasks.length === 0) throw new Error('No tasks linked to this test');

    const testJsonPath = path.resolve(test.filepath);
    this.logger.log(`Читаем тестовый JSON из: ${testJsonPath}`);
    const jsonContent = await fs.readFile(testJsonPath, 'utf-8');
    const testJsonArr = JSON.parse(jsonContent);

    if (!Array.isArray(testJsonArr)) throw new Error('Test file must be an array of checks');

    const resultsToReturn: any[] = [];
    const tempDir = path.resolve(this.baseRepoPath, 'temp_test_exports');
    await fs.mkdir(tempDir, { recursive: true });
    const requireFunc = createRequire(__filename);

    for (const task of test.tasks) {
      const taskBranchDir = path.join(this.baseRepoPath, String(task.taskId), task.branch);
      this.logger.log(`Обрабатываем задачу ${task.taskId} ветка ${task.branch}`);
      this.logger.log(`Путь к ветке задачи: ${taskBranchDir}`);

      let innerDir: string;
      try {
        const dirs = await fs.readdir(taskBranchDir, { withFileTypes: true });
        const folderDirs = dirs.filter(d => d.isDirectory());

        this.logger.log(`Найдено папок в ${taskBranchDir}: ${folderDirs.map(f => f.name).join(', ')}`);

        if (folderDirs.length !== 1) {
          this.logger.warn(`В ${taskBranchDir} ожидается ровно одна папка, найдено ${folderDirs.length}`);
          continue;
        }
        innerDir = path.join(taskBranchDir, folderDirs[0].name);
        this.logger.log(`Внутренняя папка для задачи: ${innerDir}`);
      } catch (err) {
        this.logger.warn(`Не удалось прочитать каталог: ${taskBranchDir}. Ошибка: ${err.message || err}`);
        continue;
      }

      let studentFolders: string[];
      try {
        studentFolders = await fs.readdir(innerDir, { withFileTypes: true })
          .then(entries => entries.filter(entry => entry.isDirectory()).map(entry => entry.name));
        this.logger.log(`Студенческие папки в ${innerDir}: ${studentFolders.join(', ')}`);
      } catch (err) {
        this.logger.warn(`Нет доступа к папке с работами студентов: ${innerDir}. Ошибка: ${err.message || err}`);
        continue;
      }

      if (!studentFolders.length) {
        this.logger.warn(`Нет поддиректорий (работ студентов) для задачи ${task.taskId} в ветке ${task.branch}`);
        continue;
      }

      for (const studentFolder of studentFolders) {
        const studentPath = path.join(innerDir, studentFolder);
        this.logger.log(`Обработка работы студента: ${studentPath}`);

        const parts = studentFolder.split('-');
        const githubLogin = parts[parts.length - 1];
        const studentResults: any = { files: [] };

        for (const testFileConfig of testJsonArr) {
          const { filename } = testFileConfig;
          const filePath = path.join(studentPath, filename);
          this.logger.log(`Проверяем файл: ${filePath}`);

          let fileCheckResult: {
            filename: string;
            status: string;
            message: string;
            details: { functions?: any[]; tags?: any[] } | null;
          } = {
            filename,
            status: 'not_found',
            message: `File ${filename} not found in submission`,
            details: null,
          };

          if ('functions' in testFileConfig) {
            try {
              await fs.access(filePath);
              this.logger.log(`Файл найден: ${filePath}`);

              const code = await fs.readFile(filePath, 'utf-8');
              const functionsResult: any[] = [];

              for (const funcDef of testFileConfig.functions) {
                const fnName = funcDef.name;
                const exportLine = `\nmodule.exports = { ${fnName} };\n`;
                const tempFuncFile = path.join(
                  tempDir,
                  `test${testId}_task${task.taskId}_${studentFolder}_${fnName}_${Date.now()}.js`
                );

                const oneFunctionResult: any = { name: fnName, checks: [] };

                try {
                  await fs.writeFile(tempFuncFile, code + exportLine, 'utf-8');

                  let fnModule;
                  try {
                    delete requireFunc.cache?.[requireFunc.resolve(tempFuncFile)];
                  } catch { }

                  try {
                    fnModule = requireFunc(tempFuncFile);
                  } catch (e) {
                    oneFunctionResult.error = `Ошибка при require: ${e.message || e}`;
                    functionsResult.push(oneFunctionResult);
                    await fs.unlink(tempFuncFile);
                    continue;
                  }

                  const fn = fnModule?.[fnName];

                  if (typeof fn === 'function' && Array.isArray(funcDef.inputs) && Array.isArray(funcDef.outputs)) {
                    for (let i = 0; i < funcDef.inputs.length; i++) {
                      const input = funcDef.inputs[i];
                      const expected = funcDef.outputs[i];
                      const parsedInput = isNaN(Number(input)) ? input : Number(input);

                      let passed = false;
                      let actual: string | null = null;
                      try {
                        actual = await fn(parsedInput);
                        passed = (actual == expected);
                      } catch (err) {
                        actual = `Execution error: ${err}`;
                      }

                      oneFunctionResult.checks.push({ input, expected, actual, passed });
                    }
                  } else {
                    oneFunctionResult.error = 'Function not found or invalid input/output arrays';
                  }

                  await fs.unlink(tempFuncFile);
                } catch (err) {
                  oneFunctionResult.error = `Ошибка при обработке функции: ${err.message || err}`;
                }

                functionsResult.push(oneFunctionResult);
              }

              fileCheckResult = {
                filename,
                status: 'tested',
                message: '',
                details: { functions: functionsResult }
              };

            } catch (err) {
              this.logger.warn(`Файл ${filePath} не найден или ошибка при обработке: ${err.message || err}`);
            }

          } else if ('requiredTags' in testFileConfig) {
            try {
              await fs.access(filePath);
              const htmlContent = await fs.readFile(filePath, 'utf-8');
              const cheerio = require('cheerio');
              const $ = cheerio.load(htmlContent);

              const tagsResult: any[] = [];

              for (const tagDef of testFileConfig.requiredTags) {
                const { tag, quantity } = tagDef;
                const found = $(tag).length;
                tagsResult.push({
                  tag,
                  required: quantity,
                  found,
                  passed: found === quantity
                });
              }

              fileCheckResult = {
                filename,
                status: 'tested',
                message: '',
                details: { tags: tagsResult }
              };
            } catch (err) {
              this.logger.warn(`Ошибка при проверке HTML-файла ${filePath}: ${err.message || err}`);
            }
          }

          studentResults.files.push(fileCheckResult);
        }

        const entity = this.testResultRepository.create({
          test: test,
          githubLogin,
          results: studentResults,
        });
        await this.testResultRepository.save(entity);

        resultsToReturn.push({
          testId,
          githubLogin,
          taskId: task.taskId,
          branch: task.branch,
          result: studentResults,
        });

        this.logger.log(
          `Проверены файлы для ${githubLogin}: задача ${task.taskId}, результат сохранён`
        );
      }
    }

    return resultsToReturn;
  }

  async runStudentTest(taskId: number, githubLogin: string): Promise<any[] | null> {
    const task = await this.taskRepository.findOne({
      where: { taskId },
      relations: [],
    });

    if (!task) throw new Error(`Task with taskId ${taskId} not found`);

    const test = await this.testRepository
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.tasks', 'task')
      .where('task.taskId = :taskId', { taskId })
      .getOne();

    if (!test) throw new Error(`No test found containing task with taskId ${taskId}`);

    if (!test.tasks || test.tasks.length === 0) throw new Error('No tasks linked to this test');

    const testJsonPath = path.resolve(test.filepath);
    this.logger.log(`Читаем тестовый JSON из: ${testJsonPath}`);
    const jsonContent = await fs.readFile(testJsonPath, 'utf-8');
    const testJsonArr = JSON.parse(jsonContent);

    if (!Array.isArray(testJsonArr)) throw new Error('Test file must be an array of checks');

    const resultsToReturn: any[] = [];
    const tempDir = path.resolve(this.baseRepoPath, 'temp_test_exports');
    await fs.mkdir(tempDir, { recursive: true });
    const requireFunc = createRequire(__filename);

    const relevantTasks = test.tasks.filter(t => t.taskId === taskId);

    for (const task of relevantTasks) {
      const taskBranchDir = path.join(this.baseRepoPath, String(task.taskId), task.branch);
      this.logger.log(`Обрабатываем задачу ${task.taskId} ветка ${task.branch}`);
      this.logger.log(`Путь к ветке задачи: ${taskBranchDir}`);

      let innerDir: string;
      try {
        const dirs = await fs.readdir(taskBranchDir, { withFileTypes: true });
        const folderDirs = dirs.filter(d => d.isDirectory());

        this.logger.log(`Найдено папок в ${taskBranchDir}: ${folderDirs.map(f => f.name).join(', ')}`);

        if (folderDirs.length !== 1) {
          this.logger.warn(`В ${taskBranchDir} ожидается ровно одна папка, найдено ${folderDirs.length}`);
          continue;
        }
        innerDir = path.join(taskBranchDir, folderDirs[0].name);
        this.logger.log(`Внутренняя папка для задачи: ${innerDir}`);
      } catch (err) {
        this.logger.warn(`Не удалось прочитать каталог: ${taskBranchDir}. Ошибка: ${err.message || err}`);
        continue;
      }

      let studentFolders: string[];
      try {
        studentFolders = await fs.readdir(innerDir, { withFileTypes: true })
          .then(entries => entries.filter(entry => entry.isDirectory()).map(entry => entry.name));
        this.logger.log(`Студенческие папки в ${innerDir}: ${studentFolders.join(', ')}`);
      } catch (err) {
        this.logger.warn(`Нет доступа к папке с работами студентов: ${innerDir}. Ошибка: ${err.message || err}`);
        continue;
      }

      const targetStudentFolder = studentFolders.find(folderName => {
        const parts = folderName.split('-');
        return parts[parts.length - 1] === githubLogin;
      });

      if (!targetStudentFolder) {
        this.logger.warn(`Работа студента с githubLogin "${githubLogin}" не найдена в задаче ${task.taskId}`);
        continue;
      }

      const studentPath = path.join(innerDir, targetStudentFolder);
      this.logger.log(`Обработка работы студента: ${studentPath}`);

      const studentResults: any = { files: [] };

      for (const testFileConfig of testJsonArr) {
        const { filename } = testFileConfig;
        const filePath = path.join(studentPath, filename);
        this.logger.log(`Проверяем файл: ${filePath}`);

        let fileCheckResult: {
          filename: string;
          status: string;
          message: string;
          details: { functions?: any[]; tags?: any[] } | null;
        } = {
          filename,
          status: 'not_found',
          message: `File ${filename} not found in submission`,
          details: null,
        };

        if ('functions' in testFileConfig) {
          try {
            await fs.access(filePath);
            this.logger.log(`Файл найден: ${filePath}`);

            const code = await fs.readFile(filePath, 'utf-8');
            const functionsResult: any[] = [];

            for (const funcDef of testFileConfig.functions) {
              const fnName = funcDef.name;
              const exportLine = `\nmodule.exports = { ${fnName} };\n`;
              const tempFuncFile = path.join(
                tempDir,
                `test${test.id}_task${task.taskId}_${targetStudentFolder}_${fnName}_${Date.now()}.js`
              );

              const oneFunctionResult: any = { name: fnName, checks: [] };

              try {
                await fs.writeFile(tempFuncFile, code + exportLine, 'utf-8');

                let fnModule;
                try {
                  delete requireFunc.cache?.[requireFunc.resolve(tempFuncFile)];
                } catch { }

                try {
                  fnModule = requireFunc(tempFuncFile);
                } catch (e) {
                  oneFunctionResult.error = `Ошибка при require: ${e.message || e}`;
                  functionsResult.push(oneFunctionResult);
                  await fs.unlink(tempFuncFile);
                  continue;
                }

                const fn = fnModule?.[fnName];

                if (typeof fn === 'function' && Array.isArray(funcDef.inputs) && Array.isArray(funcDef.outputs)) {
                  for (let i = 0; i < funcDef.inputs.length; i++) {
                    const input = funcDef.inputs[i];
                    const expected = funcDef.outputs[i];
                    const parsedInput = isNaN(Number(input)) ? input : Number(input);

                    let passed = false;
                    let actual: string | null = null;
                    try {
                      actual = await fn(parsedInput);
                      passed = actual == expected;
                    } catch (err) {
                      actual = `Execution error: ${err}`;
                    }

                    oneFunctionResult.checks.push({ input, expected, actual, passed });
                  }
                } else {
                  oneFunctionResult.error = 'Function not found or invalid input/output arrays';
                }

                await fs.unlink(tempFuncFile);
              } catch (err) {
                oneFunctionResult.error = `Ошибка при обработке функции: ${err.message || err}`;
              }

              functionsResult.push(oneFunctionResult);
            }

            fileCheckResult = {
              filename,
              status: 'tested',
              message: '',
              details: { functions: functionsResult }
            };

          } catch (err) {
            this.logger.warn(`Файл ${filePath} не найден или ошибка при обработке: ${err.message || err}`);
          }

        } else if ('requiredTags' in testFileConfig) {
          try {
            await fs.access(filePath);
            const htmlContent = await fs.readFile(filePath, 'utf-8');
            const cheerio = require('cheerio');
            const $ = cheerio.load(htmlContent);

            const tagsResult: any[] = [];

            for (const tagDef of testFileConfig.requiredTags) {
              const { tag, quantity } = tagDef;
              const found = $(tag).length;
              tagsResult.push({
                tag,
                required: quantity,
                found,
                passed: found === quantity
              });
            }

            fileCheckResult = {
              filename,
              status: 'tested',
              message: '',
              details: { tags: tagsResult }
            };
          } catch (err) {
            this.logger.warn(`Ошибка при проверке HTML-файла ${filePath}: ${err.message || err}`);
          }
        }

        studentResults.files.push(fileCheckResult);
      }

      resultsToReturn.push({
        testId: test.id,
        githubLogin,
        taskId: task.taskId,
        branch: task.branch,
        result: studentResults,
      });

      this.logger.log(
        `Проверены файлы для ${githubLogin}: задача ${task.taskId}, результат готов`
      );
    }

    if (resultsToReturn.length === 0) {
      this.logger.warn(`Для githubLogin "${githubLogin}" не было обработано ни одной задачи.`);
      return null;
    }

    return resultsToReturn;
  }

}
