module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-gitinfo');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-rename-util');

  grunt.loadNpmTasks('grunt-sftp-deploy');

  //custom tasks
  grunt.loadTasks('_tasks');


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    gitinfo: {
      options: {

      }
    },

    clean: {
      stage: ['build/staging/**'],
      dist: ['build/dist/**']
    },

    copy: {
      stage: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: 'public',
            src: ['./!(css|js)**', './!(css|js)**/**'],
            dest: 'build/staging/'
          },
          {
            expand: true,
            dot: true,
            cwd: 'public',
            src: ['./!(css|js)**/**'],
            dest: 'build/staging/'
          }
        ]
      },
      dist: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: 'public',
            src: ['./!(css|js)**', './!(css|js)**/**'],
            dest: 'build/dist/'
          }
        ]
      }
    },

    replace: {
      stage: {
        src: ['build/staging/index.html', 'build/staging/version.json', 'build/staging/js/bundle.js'],
        overwrite: true,
        replacements: [
          {
            from: /\{\{version\}\}/,
            to: '<%= pkg.version %>'
          },
          {
            from: /\{\{build\}\}/,
            to: '<%= gitinfo.local.branch.current.shortSHA + " [staging]" %>'
          },
          {
            from: /js\/bundle\.js/g,
            to: 'js-' + '<%= gitinfo.local.branch.current.shortSHA %>' + '/bundle.js'
          },
          {
            from: /css\/bundle\.css/g,
            to: 'css-' + '<%= gitinfo.local.branch.current.shortSHA %>' + '/bundle.css'
          },
          {
            from: /css\/global\.css/g,
            to: 'css-' + '<%= gitinfo.local.branch.current.shortSHA %>' + '/global.css'
          }
        ]
      },
      dist: {
        src: ['build/dist/index.html', 'build/dist/version.json', 'build/dist/js/bundle.js'],
        overwrite: true,
        replacements: [
          {
            from: /\{\{version\}\}/,
            to: '<%= pkg.version %>'
          },
          {
            from: /\{\{build\}\}/,
            to: '<%= gitinfo.local.branch.current.shortSHA %>'
          },
          {
            from: /js\/bundle\.js/g,
            to: 'js-' + '<%= gitinfo.local.branch.current.shortSHA %>' + '/bundle.js'
          },
          {
            from: /css\/bundle\.css/g,
            to: 'css-' + '<%= gitinfo.local.branch.current.shortSHA %>' + '/bundle.css'
          },
          {
            from: /css\/global\.css/g,
            to: 'css-' + '<%= gitinfo.local.branch.current.shortSHA %>' + '/global.css'
          }
        ]
      },
      sourcemap_link:{
        src:'build/dist/js-*/*.js',
        overwrite: true,
        replacements:[
          {
            from: /(\/\/\#\ssourceMappingURL=.*)/,
            to: ''
          }
        ]
      }
    },

    rename: {
      stage: {
        files: [
          {
            src: 'build/staging/js',
            dest: 'build/staging/js-' + '<%= gitinfo.local.branch.current.shortSHA %>'
          },
          {
            src: 'build/staging/css',
            dest: 'build/staging/css-' + '<%= gitinfo.local.branch.current.shortSHA %>'
          }]
      },
      dist: {
        files: [
          {
            src: 'build/dist/js',
            dest: 'build/dist/js-' + '<%= gitinfo.local.branch.current.shortSHA %>'
          },
          {
            src: 'build/dist/css',
            dest: 'build/dist/css-' + '<%= gitinfo.local.branch.current.shortSHA %>'
          }]
      }
    },


    manifest: {
      prod: {
        options: {
          basePath: 'build/dist',
          verbose: true,
          timestamp: false,
          hash: true,
          master: ['index.html']
        },
        src: ['assets/js/*', 'assets/css/*', 'assets/fonts/!(Pe-icon-7-stroke)*.*', 'assets/images/*.png', 'assets/images/*.jpg'],
        dest: 'build/dist/manifest.appcache'
      }
    },

    img_preload: {
      inject:{
        options:{
          templateString: '<img src="{{$options.baseUrl}}images/icons/{{val}}" />',
        },
        src:'public/images/icons/*.svg',
        dest:'src/components/App.html'
      },
      revert:{
        options:{
          empty: true
        },
        dest: 'src/components/App.html'
      }
    },

    'sftp-deploy': {
      stage: {
        auth: {
          host: '138.68.117.169',
          port: 22,
          authKey: 'livekey'
        },
        cache: false,
        src: './build/staging/',
        dest: '/var/www/html/optigen.kws3.media/',  // this is on the remote host
        exclusions: ['./build/staging/**/.DS_Store', './build/staging/**/Thumbs.db'],
        serverSep: '/',
        concurrency: 20,
        progress: true
      },
      dist: {
        auth: {
          host: '',
          port: 22,
          authKey: 'livekey'
        },
        cache: false,
        src: './build/dist/',
        dest: '/var/www/html/admin/',  // this is on the remote host
        exclusions: ['./build/dist/**/.DS_Store', './build/dist/**/Thumbs.db'],
        serverSep: '/',
        concurrency: 20,
        progress: true
      }
    }

  });

  grunt.registerTask('stage', [
    'gitinfo',
    'copy:stage',
    'replace:stage'
  ]);
  grunt.registerTask('dist', [
    'gitinfo',
    'copy:dist',
    'replace:dist'
  ]);

  grunt.registerTask('uncache:dist', [
    'gitinfo',
    'rename:dist'
  ]);

  grunt.registerTask('uncache:stage', [
    'gitinfo',
    'rename:stage'
  ]);

  grunt.registerTask('rollbar:dist', [
    'gitinfo',
    //'rollbar_upload:dist'
  ]);

  grunt.registerTask('preload:populate', ['img_preload:inject']);
  grunt.registerTask('preload:revert', ['img_preload:revert']);

  grunt.registerTask('deploy:stage', ['sftp-deploy:stage']);
  grunt.registerTask('deploy:dist', ['replace:sourcemap_link', 'sftp-deploy:dist']);


}