const fs = require('fs');
const path = require('path');

const libraries = [
  {
    dir: 'react-native-nitro-modules',
    target: 'react_codegen_NitroModulesSpec',
  },
  {
    dir: 'react-native-worklets-core',
    target: 'react_codegen_RNWorkletsSpec',
  },
];

const nodeModules = path.join(__dirname, '..', 'node_modules');

for (const lib of libraries) {
  const codegenDir = path.join(
    nodeModules,
    lib.dir,
    'android',
    'build',
    'generated',
    'source',
    'codegen',
    'jni',
  );

  if (!fs.existsSync(codegenDir)) {
    fs.mkdirSync(codegenDir, { recursive: true });
    const cmake = `cmake_minimum_required(VERSION 3.13)

add_library(${lib.target} INTERFACE)

target_include_directories(${lib.target} INTERFACE .)

target_link_libraries(${lib.target} INTERFACE)
`;
    fs.writeFileSync(path.join(codegenDir, 'CMakeLists.txt'), cmake);
    console.log(`Created stub codegen for ${lib.dir}`);
  }
}
