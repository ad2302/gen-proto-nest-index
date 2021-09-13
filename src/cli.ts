#!/usr/bin/env node
import { Command } from "commander";
import { generateIndexFile } from "./index";

const program = new Command();
program.storeOptionsAsProperties();
program.description("rename modules to specific case and update imports");
program.requiredOption("-d, --dest <dest>", "dest dir");
program.argument("<glob...>", "glob pattern to proto source files");
program.action((source) => {
  const options = program.opts();
  const dest = options.dest;
  generateIndexFile(source,dest);
});
program.parse();
