import schemaParser from "protocol-buffers-schema";
import fg from "fast-glob";
import { promisify } from "util";
import { readFile, writeFile } from "fs";
import path from "path";
import pathExists from 'path-exists';

const _readFile = promisify(readFile);
const _writeFile = promisify(writeFile);
interface NestOptions {
  package: string | string[]; //'num',
  protoPath: string | string[]; //join(__dirname, './num/num.proto'),
}

export async function generateIndex(
  source: string | string[],
  root?: string
): Promise<NestOptions> {
  const result = {
    package: [],
    protoPath: [],
  };
  const protos = await fg(source, {
    absolute: true
  });
  const _root = root ? path.resolve(root) : '';
  const nestOptions = await Promise.all(
    protos.map(async (p) => {
      const c = await _readFile(p, "utf-8");
      const s = schemaParser.parse(c);
      const protoPath = _root ? path.relative(_root,p) : path.basename(p);
      return { package: s.package, protoPath };
    })
  );
  nestOptions.forEach((o) => {
    if (o.package){
      result.package.push(o.package);
    }
    result.protoPath.push(o.protoPath);
  });
  return result;
}

export function generateIndexString(options: NestOptions): string {
  const c = `
const path = require('path');
module.exports = {
  package: ${JSON.stringify(options.package)},
  protoPath:${JSON.stringify(
    options.protoPath
  )}.map(p => path.join(__dirname,p))
}
`;
    return c;
  }

export function generateIndexStringTs(options: NestOptions, middleContent: string): string {
const c = `
import * as path from 'path';
${middleContent}
export const nestOptions = {
  package: ${JSON.stringify(options.package)},
  protoPath:${JSON.stringify(
    options.protoPath
  )}.map(p => path.join(__dirname,p))
}
`;
  return c;
}

export async function generateIndexFile(
  source: string | string[],
  dest: string,
  root?: string
): Promise<void> {
  const options = await generateIndex(source, root);
  const destIndexTs = path.join(dest, "index.ts");
  const ts = await pathExists(destIndexTs);
  const destIndexPath = ts ? destIndexTs : path.join(dest, "index.js")
  if( ts ) {
    const original = await _readFile(destIndexPath,'utf8');
    const content = generateIndexStringTs(options,original);
    await _writeFile(destIndexPath, content);
  } else {
    const content = generateIndexString(options)
    await _writeFile(destIndexPath, content);
  }

}
