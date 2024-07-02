import { I18nTranslation } from 'nestjs-i18n';
import * as path from 'path';

const jsonfile = require('jsonfile');
import * as ts from 'typescript';
import * as fs from 'fs';

const getDataObject = async () => {
  const errorsPath = path.join(__dirname, '../../i18n/en/errors.json');
  const argsPath = path.join(__dirname, '../../i18n/en/args.json');

  const errorsObject = await jsonfile.readFileSync(errorsPath);
  const argsObject = await jsonfile.readFileSync(argsPath);

  return {
    errors: { errors: { ...errorsObject } },
    args: { args: { ...argsObject } },
  };
};

const convertObjectToTypeDefinition = async (
  object: any,
): Promise<ts.TypeElement[]> => {
  switch (typeof object) {
    case 'object':
      return Promise.all(
        Object.keys(object).map(async (key) => {
          if (typeof object[key] === 'string') {
            return ts.factory.createPropertySignature(
              undefined,
              ts.factory.createStringLiteral(key),
              undefined,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            );
          }
          if (Array.isArray(object[key])) {
            return ts.factory.createPropertySignature(
              undefined,
              ts.factory.createStringLiteral(key),
              undefined,
              ts.factory.createTupleTypeNode(
                Array(object[key].length).fill(
                  ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                ),
              ),
            );
          }
          return ts.factory.createPropertySignature(
            undefined,
            ts.factory.createStringLiteral(key),
            undefined,
            ts.factory.createTypeLiteralNode(
              await convertObjectToTypeDefinition(object[key]),
            ),
          );
        }),
      );
  }

  return [];
};

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const createTypesFile = async (object: any) => {
  const sourceFile = ts.createSourceFile(
    'placeholder.ts',
    '',
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );

  const i18nTranslationsType = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier('I18nTranslations'),
    undefined,
    ts.factory.createTypeLiteralNode(
      await convertObjectToTypeDefinition(object),
    ),
  );

  const nodes = ts.factory.createNodeArray([
    ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier('Path'),
          ),
        ]),
      ),
      ts.factory.createStringLiteral('nestjs-i18n'),
      undefined,
    ),
    i18nTranslationsType,
    ts.factory.createTypeAliasDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createIdentifier('I18nPath'),
      undefined,
      ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Path'), [
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier('I18nTranslations'),
          undefined,
        ),
      ]),
    ),
  ]);

  nodes.forEach((node) => {
    ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      ' prettier-ignore ',
      true,
    );
  });

  return printer.printList(ts.ListFormat.MultiLine, nodes, sourceFile);
};

const annotateSourceCode = (code: string) => {
  return `/* DO NOT EDIT, file generated by nestjs-i18n */
  
/* eslint-disable */
${code}`;
};

function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function mergeDeep(target: I18nTranslation, ...sources: any) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key] as I18nTranslation, source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

const generateTypeSafe = async () => {
  const typesOutputPath = path.join(
    __dirname,
    '../generated/i18n.generated.ts',
  );

  const t = await getDataObject();

  const object = Object.keys(t).reduce(
    (result, key) => mergeDeep(result, t[key]),
    {},
  );

  const rawContent = await createTypesFile(object);

  if (!rawContent) {
    return;
  }

  const outputFile = annotateSourceCode(rawContent);

  fs.mkdirSync(path.dirname(typesOutputPath), {
    recursive: true,
  });

  let currentFileContent = null;

  try {
    currentFileContent = fs.readFileSync(typesOutputPath, 'utf8');
  } catch (err) {
    console.log(err);
  }
  if (currentFileContent != outputFile) {
    fs.writeFileSync(typesOutputPath, outputFile);
    console.log(
      `Types generated in: ${typesOutputPath}.
      Please also add it to your eslintignore file to avoid linting errors
      `,
    );
  } else {
    console.log('No changes detected');
  }
};

generateTypeSafe();
