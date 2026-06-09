/* eslint-disable no-console -- this is for scripts */

import { spawn } from 'child_process'
import chalk from 'chalk'
import inquirer from 'inquirer'

export const logger = {
  success: (msg: string) => console.log(chalk.green('✓ ' + msg)),
  error: (msg: string) => console.error(chalk.red('✗ ' + msg)),
  warn: (msg: string) => console.warn(chalk.yellow('⚠ ' + msg)),
  info: (msg: string) => console.log(chalk.blue('• ' + msg)),
  text: (msg: string) => console.log(chalk.gray('  ' + msg)),
}

export const prompt = {
  confirm: async (msg: string) => {
    const res = await inquirer.prompt([
      { type: 'confirm', name: 'confirmed', message: msg, default: false },
    ])
    return res.confirmed as boolean
  },
  text: async (msg: string) => {
    const res = await inquirer.prompt([{ type: 'input', name: 'text', message: msg }])
    return res.text as string
  },
  select: async (msg: string, choices: string[]) => {
    const res = await inquirer.prompt([{ type: 'list', name: 'selected', message: msg, choices }])
    return res.selected as string
  },
  password: async (msg: string) => {
    const res = await inquirer.prompt([{ type: 'password', name: 'password', message: msg }])
    return res.password as string
  },
}

export const runChildProcess = async (cmd: string, options?: { cwd?: string }) => {
  return new Promise<string>((resolve, reject) => {
    const [command, ...args] = cmd.split(' ')
    const child = spawn(command!, args, { cwd: options?.cwd })
    let stdoutData = ''
    let stderrData = ''
    child.stdout.on('data', (data) => {
      stdoutData += data.toString()
    })
    child.stderr.on('data', (data) => {
      stderrData += data.toString()
    })
    child.on('close', async (code) => {
      if (code === 0) return resolve(stdoutData)
      logger.error(`child process exited with code ${code}:\n\n${stderrData}`)
      reject()
    })
  })
}
