const fs = require('fs');
const path = require('path');

const libraries = [
  { dir: 'react-native-nitro-modules', target: 'react_codegen_NitroModulesSpec' },
  { dir: 'react-native-worklets-core', target: 'react_codegen_RNWorkletsSpec' },
];

const nodeModules = path.join(__dirname, '..', 'node_modules');

for (const lib of libraries) {
  const codegenDir = path.join(nodeModules, lib.dir, 'android', 'build', 'generated', 'source', 'codegen', 'jni');

  if (!fs.existsSync(codegenDir)) {
    fs.mkdirSync(codegenDir, { recursive: true });

    const srcVar = lib.target + '_SRCS';
    const cmake = [
      'cmake_minimum_required(VERSION 3.13)',
      'set(CMAKE_VERBOSE_MAKEFILE on)',
      '',
      'file(GLOB ' + srcVar + ' CONFIGURE_DEPENDS *.cpp)',
      '',
      'add_library(',
      '  ' + lib.target,
      '  OBJECT',
      '  ${' + srcVar + '}',
      ')',
      '',
      'target_include_directories(' + lib.target + ' PUBLIC .)',
      '',
      'target_link_libraries(',
      '  ' + lib.target,
      '  fbjni',
      '  jsi',
      '  reactnative',
      ')',
      '',
    ].join('\n');

    fs.writeFileSync(path.join(codegenDir, 'empty.cpp'), '// auto-generated stub\nint __empty_stub__ = 0;\n');
    fs.writeFileSync(path.join(codegenDir, 'CMakeLists.txt'), cmake);
    console.log('Created stub codegen for ' + lib.dir);
  }
}
