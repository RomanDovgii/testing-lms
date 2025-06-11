// Copyright (C) 2024 Roman Dovgii
// This file is part of LMS with github classroom integration.
//
// LMS with github classroom integration is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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