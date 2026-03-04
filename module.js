const fs = require("fs");
const path = require("path");

const moduleName = process.argv[2];

if (!moduleName) {
  console.error(
    "❌ Please provide a module name.\nUsage: node module.js moduleName"
  );
  process.exit(1);
}

const baseDir = path.join(
  __dirname,
  "src",
  "app",
  "modules",
  moduleName.toLowerCase()
);

if (fs.existsSync(baseDir)) {
  console.error(`❌ Module "${moduleName}" already exists.`);
  process.exit(1);
}

fs.mkdirSync(baseDir, { recursive: true });

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const capModule = capitalize(moduleName);

const files = {
  [`${moduleName}.service.ts`]: `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const create${capModule} = async (data: any) => {
  await prisma.${moduleName}.create({ data });
  return
};

const getAll${capModule}s = async () => {
  const results = await prisma.${moduleName}.findMany();
  return results
};

const get${capModule}ById = async (id: string) => {
  const result = await prisma.${moduleName}.findUnique({ where: { id } });
  return result
};

const update${capModule} = async (id: string, data: any) => {
  await prisma.${moduleName}.update({ where: { id }, data });
  return
};

const delete${capModule} = async (id: string) => {
  await prisma.${moduleName}.delete({ where: { id } });
  return
};

export const ${moduleName}Services = {
  create${capModule},
  getAll${capModule}s,
  get${capModule}ById,
  update${capModule},
  delete${capModule},
}
  `,

  [`${moduleName}.controller.ts`]: `
import {${moduleName}Services} from './${moduleName}.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";

const create${capModule} = catchAsync (async (req, res) => {
  await ${moduleName}Services.create${capModule}(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The ${moduleName} has been created successfully"
  });
})

const getAll${capModule}s = catchAsync(async (req, res) => {
  const result = await ${moduleName}Services.getAll${capModule}s();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All ${moduleName}s has been retrived successfully",
    data: result,
  });
})

const get${capModule}ById = catchAsync(async (req, res) => {
  const result = await ${moduleName}Services.get${capModule}ById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "${moduleName} has been retrived successfully",
    data: result,
  });
})

const update${capModule} = catchAsync(async (req, res) => {
  await ${moduleName}Services.update${capModule}(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "${moduleName} has been updated successfully"
  });
})

const delete${capModule} = catchAsync(async (req, res) => {
  await ${moduleName}Services.delete${capModule}(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "${moduleName} has been deleted successfully",
  });
})

export const ${moduleName}Controllers = {
  create${capModule},
  getAll${capModule}s,
  get${capModule}ById,
  update${capModule},
  delete${capModule},
}
  `,

  [`${moduleName}.routes.ts`]: `
import express from 'express';
import { ${moduleName}Controllers } from "./${moduleName}.controller";

const router = express.Router();

router.post('/', ${moduleName}Controllers.create${capModule});
router.get('/', ${moduleName}Controllers.getAll${capModule}s);
router.get('/:id', ${moduleName}Controllers.get${capModule}ById);
router.patch('/:id', ${moduleName}Controllers.update${capModule});
router.delete('/:id', ${moduleName}Controllers.delete${capModule});

export const ${moduleName}Routes = router;
  `,

  [`${moduleName}.validation.ts`]: `
import * as z from 'zod';

export const create${capModule}Schema = z.object({
  // Define fields
  name: z.string(),
});

export const ${capModule}SchemaValidation = {
create${capModule}Schema
};
  `,
};

for (const [filename, content] of Object.entries(files)) {
  const filePath = path.join(baseDir, filename);
  fs.writeFileSync(filePath, content.trimStart());
}

console.log(
  `✅ ${capModule} module created successfully at src/app/modules/${moduleName}`
);
