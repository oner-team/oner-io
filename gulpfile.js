var gulp = require('gulp');

// https://github.com/shama/webpack-stream
var webpack = require('webpack-stream');

// https://www.npmjs.com/package/gulp-rename/
var rename = require("gulp-rename");

// https://www.npmjs.com/package/gulp-uglify/
var uglify = require('gulp-uglify');

// https://www.npmjs.com/package/del
var del = require('del');

// http://browsersync.io/
var browserSync = require('browser-sync');

// pack natty-db.js and test.js
gulp.task('pack', ['del'], function() {
    return gulp.src('src/index.js').pipe(webpack({
        entry: {
            'natty-db': './src/index.js', // NOTE 不写`./`会报错
            test: './test/global.spec.js'
        },
        output: {
            // 不要配置path，会报错
            //path: 'dist',
            filename: '[name].js',
            sourceMapFilename: '[name].js.map'
        },
        // 这个配置要和 output.sourceMapFilename 一起使用
        devtool: '#source-map',
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader?stage=1'
                },{
                    test: /test\/[a-zA-Z0-9]+\.spec\.js/,
                    loaders: ['mocha', 'babel-loader?stage=1'] // mocha必须写在babel之前 没想通
                }
            ]
        },
        externals:  {
            rsvp: 'commonjs rsvp' //
            //rsvp: 'var RSVP'
        }
    })).pipe(gulp.dest('./dist'));
});

gulp.task('del', function (done) {
    del(['dist']).then(function () {
        done();
    });
});

gulp.task('min', function () {
    return gulp.src('dist/*.js').pipe(uglify()).pipe(rename(function (path) {
        path.basename += '.min';
    })).pipe(gulp.dest('./dist'));
});

gulp.task('reload', ['pack'], function () {
    browserSync.reload();
});

// 启动监听
gulp.task('watch', ['pack'], function () {

    browserSync({
        server: {
            baseDir: './'
        },
        notify: false
    });

    gulp.watch([
        'src/**/*.js',
        'test/**/*.js'
    ], ['reload']);
});