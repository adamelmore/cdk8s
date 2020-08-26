const { LernaProject, JsiiProject, TypeScriptProject, Semver, GithubWorkflow } = require('projen');
const common = require('./packages/projen-common');

const cdk8sProject = new JsiiProject({
  name: 'cdk8s',
  description: 'Cloud Development Kit for Kubernetes',
  stability: 'experimental',

  ...common.options,

  // dependencies
  jsiiVersion: Semver.caret(common.versions.jsii),
  peerDependencies: {
    constructs: Semver.pinned(common.versions.constructs),
  },
  dependencies: {
    'follow-redirects': Semver.caret('1.11.0'),
    'json-stable-stringify': Semver.caret('1.0.1'),
    yaml: Semver.caret('1.7.2'),
  },
  bundledDependencies: ['yaml', 'json-stable-stringify', 'follow-redirects'],
  devDependencies: {
    '@types/follow-redirects': Semver.caret('1.8.0'),
    '@types/json-stable-stringify': Semver.caret('1.0.32'),
    '@types/yaml': Semver.caret('1.2.0'),
    constructs: Semver.caret(common.versions.constructs),
    'json-schema-to-typescript': Semver.caret('8.0.1'),
  },

  // jsii configuration
  java: {
    javaPackage: 'org.cdk8s',
    mavenGroupId: 'org.cdk8s',
    mavenArtifactId: 'cdk8s',
  },
  python: {
    distName: 'cdk8s',
    module: 'cdk8s',
  },
  dotnet: {
    dotNetNamespace: 'Org.Cdk8s',
    packageId: 'Org.Cdk8s',
  },
});

common.fixup(cdk8sProject);

// _loadurl.js is written in javascript so we need to commit it and also copy it
// after compilation to the `lib/` directory.
cdk8sProject.gitignore.include('/src/_loadurl.js');
cdk8sProject.addCompileCommand('cp src/_loadurl.js lib/');

const cdk8sCliProject = new TypeScriptProject({
  name: 'cdk8s-cli',
  description: 'CDK for Kubernetes CLI',
  bin: {
    cdk8s: 'bin/cdk8s'
  },
  dependencies: {
    'cdk8s': Semver.pinned('0.0.0'),
    'codemaker': Semver.caret('0.22.0'),
    'constructs': Semver.caret('2.0.2'),
    'fs-extra': Semver.caret('8.1.0'),
    'jsii-srcmak': Semver.caret('0.1.10'),
    'sscaff': Semver.caret('1.2.0'),
    'yaml': Semver.caret('1.7.2'),
    'yargs': Semver.caret('15.1.0'),
    'json2jsii': Semver.caret('0.1.4'),
  },
  devDependencies: {
    '@types/fs-extra': Semver.caret('8.1.0'),
    '@types/json-schema': Semver.caret('7.0.5'),
  },
  ...common.options,
});

// add @types/node as a regular dependency since it's needed to during 'import'
// to compile the generated jsii code.
cdk8sCliProject.addDependencies({
  '@types/node': Semver.caret(cdk8sCliProject.manifest.devDependencies['@types/node'].replace(/^\^/, ''))
});

cdk8sCliProject.eslint.addIgnorePattern('/templates/');
cdk8sCliProject.jest.addIgnorePattern('/templates/');

common.fixup(cdk8sCliProject);

const cdk8sDependency = Semver.caret('0.0.0');

const cdk8sPlusProject = new JsiiProject({
  name: 'cdk8s-plus',
  description: 'High level abstractions on top of cdk8s',
  stability: 'experimental',

  ...common.options,

  // dependencies
  jsiiVersion: Semver.caret(common.versions.jsii),
  peerDependencies: {
    constructs: Semver.caret(common.versions.constructs),
    cdk8s: cdk8sDependency,
  },
  dependencies: {
    minimatch: Semver.caret('3.0.4'),
    cdk8s: cdk8sDependency
  },
  bundledDependencies: [ 'minimatch' ],
  devDependencies: {
    '@types/minimatch': Semver.caret('3.0.3'),
  },

  // jsii configuration
  java: {
    javaPackage: 'org.cdk8s.plus',
    mavenGroupId: 'org.cdk8s',
    mavenArtifactId: 'cdk8s-plus'
  },
  python: {
    distName: 'cdk8s-plus',
    module: 'cdk8s_plus'
  },
  dotnet: {
    dotNetNamespace: 'Org.Cdk8s.Plus',
    packageId: 'Org.Cdk8s.Plus'
  }
});

common.fixup(cdk8sPlusProject);

const project = new LernaProject({
  name: 'root',

  ...common.options,
  mergify: true,

  lernaVersion: Semver.caret('3.20.2'),
  version: {
    skip: { tag: true },
    versionFilename: 'lerna.json',
  },
  packages: [
    { project: cdk8sProject },
    { project: cdk8sCliProject },
    { project: cdk8sPlusProject },
  ],
  scripts: {
    bump: 'tools/bump.sh',
    build: 'lerna run build',
    test: 'lerna run test',
    package: 'lerna run package && tools/collect-dist.sh',
    integ: 'test/run-against-dist test/test-all.sh',
    'integ:update': 'UPDATE_SNAPSHOTS=1 yarn integ',
    'release-github': 'tools/release-github.sh',
  },
  devDependencies: {
    'changelog-parser': Semver.caret('2.8.0'),
    'standard-version': Semver.caret('8.0.1'),
    semver: Semver.pinned('7.3.2'),
    'jsii-release': Semver.caret('0.1.9'),
  },
  gitignore: [
    'dist/',
    '.gen',
    '.vscode/',
    'cdk.out',
    '*.d.ts',
    '*.js',
    '!jest.config.js',
    'lib/.generated',
    '.grunt',
    'bower_components',
    '.lock-wscript',
    'typings/',
    '.npm',
    '.node_repl_history',
    '.env',
    '.env.test',
    '.next',
    '.nuxt',
    '.vuepress/dist',
    '.serverless/',
    '.fusebox/',
    '.dynamodb/',
    '!/tools/*.js',
  ]
});

project.manifest.jest = {
  clearMocks: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  preset: 'ts-jest',
  testMatch: [
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  globals: {
    'ts-jest': {
      'tsConfig': 'tsconfig.jest.json'
    }
  }
};

const container = { image: 'jsii/superchain' };

const buildJob = {
  'runs-on': 'ubuntu-latest',
  container,
  steps: [
    { uses: 'actions/checkout@v2' },
    {
      name: 'installing dependencies',
      run: 'pip3 install pipenv\nyarn install',
    },
    {
      name: 'compile',
      run: 'tools/align-version.sh\nyarn build',
    },
    { name: 'unit tests', run: 'yarn test' },
    { name: 'create bundle', run: 'yarn package' },
    { name: 'integration tests', run: 'yarn integ' },
  ]
};

const build = new GithubWorkflow(project, 'Build');
build.on({'pull_request': {}})
build.addJobs({ build: buildJob });

const release = new GithubWorkflow(project, 'Release');
release.on({ push: { branches: ['master'] } });
release.addJobs({
  build_artifact: {
    name: 'Build and upload artifact',
    if: "github.repository == 'awslabs/cdk8s'",
    ...buildJob,
    steps: [
      ...buildJob.steps,
      {
        name: 'Upload artifact',
        uses: 'actions/upload-artifact@v1',
        with: { name: 'dist', path: 'dist' },
      },
      {
        name: 'Release to github',
        run: 'yarn release-github',
        env: {
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
        },
      },
    ]
  },
  release_maven: {
    name: 'Release to Maven',
    needs: 'build_artifact',
    'runs-on': 'ubuntu-latest',
    container,
    steps: [
      {
        name: 'Download build artifacts',
        uses: 'actions/download-artifact@v1',
        with: {
          name: 'dist'
        }
      },
      {
        name: 'Release',
        run: 'npx -p jsii-release jsii-release-maven',
        env: {
          'MAVEN_GPG_PRIVATE_KEY': '${{ secrets.MAVEN_GPG_PRIVATE_KEY }}',
          'MAVEN_GPG_PRIVATE_KEY_PASSPHRASE': '${{ secrets.MAVEN_GPG_PRIVATE_KEY_PASSPHRASE }}',
          'MAVEN_PASSWORD': '${{ secrets.MAVEN_PASSWORD }}',
          'MAVEN_USERNAME': '${{ secrets.MAVEN_USERNAME }}',
          'MAVEN_STAGING_PROFILE_ID': '${{ secrets.MAVEN_STAGING_PROFILE_ID }}'
        }
      }
    ]
  },
  release_npm: {
    name: 'Release to NPM',
    needs: 'build_artifact',
    'runs-on': 'ubuntu-latest',
    container,
    steps: [
      {
        name: 'Download build artifacts',
        uses: 'actions/download-artifact@v1',
        with: {
          name: 'dist'
        }
      },
      {
        name: 'Release',
        run: 'npx -p jsii-release jsii-release-npm',
        env: {
          'NPM_TOKEN': '${{ secrets.NPM_TOKEN }}'
        }
      }
    ]
  },
  release_nuget: {
    name: 'Release to Nuget',
    needs: 'build_artifact',
    'runs-on': 'ubuntu-latest',
    container,
    steps: [
      {
        name: 'Download build artifacts',
        uses: 'actions/download-artifact@v1',
        with: {
          name: 'dist'
        }
      },
      {
        name: 'Release',
        run: 'npx -p jsii-release jsii-release-nuget',
        env: {
          'NUGET_API_KEY': '${{ secrets.NUGET_API_KEY }}'
        }
      }
    ]
  },
  release_pypi: {
    name: 'Release to PyPi',
    needs: 'build_artifact',
    'runs-on': 'ubuntu-latest',
    container,
    steps: [
      {
        name: 'Download build artifacts',
        uses: 'actions/download-artifact@v1',
        with: {
          name: 'dist'
        }
      },
      {
        name: 'Release',
        run: 'npx -p jsii-release jsii-release-pypi',
        env: {
          'TWINE_USERNAME': '${{ secrets.TWINE_USERNAME }}',
          'TWINE_PASSWORD': '${{ secrets.TWINE_PASSWORD }}'
        }
      }
    ]
  },
  release_homebrew: {
    name: 'Release to Homebrew',
    if: "startsWith(github.event.head_commit.message, 'chore(release)')",
    needs: 'release_npm',
    'runs-on': 'ubuntu-latest',
    steps: [
      {
        uses: 'actions/checkout@v2'
      },
      {
        name: 'version',
        id: 'get_version',
        run: 'version=$(node -p \"require(\'./package.json\').version\")\necho \"::set-output name=version::${version}\"\n',
      },
      {
        uses: 'mislav/bump-homebrew-formula-action@v1',
        with: {
          'formula-name': 'cdk8s',
          'download-url': "https://registry.npmjs.org/cdk8s-cli/-/cdk8s-cli-${{steps.get_version.outputs.version}}.tgz",
          'commit-message': 'cdk8s ${{ steps.get_version.outputs.version }}'
        },
        env: {
          'COMMITTER_TOKEN': '${{ secrets.HOMEBREW_COMMITTER_TOKEN }}'
        }
      }
    ]
  },
});

const noHoist = ['yaml', 'json-stable-stringify', 'follow-redirects'];
noHoist.forEach(module => {
  project.noHoist(cdk8sProject, module);
  project.noHoist(cdk8sProject, `${module}/**`);
});

project.noHoist(cdk8sPlusProject, 'minimatch');
project.noHoist(cdk8sPlusProject, 'minimatch/**');

project.addWorkspace('examples/**/*');

project.synth();
