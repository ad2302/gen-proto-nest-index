import schemaParser from "protocol-buffers-schema";
import fg from "fast-glob";
import { promisify } from "util";
import { readFile, writeFile } from "fs";
import path from "path";

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
      const protoPath = _root ? path.relative(p,_root) : path.basename(p);
      return { package: s.package, protoPath };
    })
  );
  nestOptions.forEach((o) => {
    result.package.push(o.package);
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

export async function generateIndexFile(
  source: string | string[],
  dest: string,
  root?: string
): Promise<void> {
  const o = await generateIndex(source, root);
  const content = generateIndexString(o);
  await _writeFile(path.join(dest, "index.js"), content);
}
