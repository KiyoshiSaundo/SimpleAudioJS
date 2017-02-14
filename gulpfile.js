var gulp = require('gulp'),
	watch = require('gulp-watch'),
	minify = require('gulp-minify');

// scripts
gulp.task('build', function() {
	return gulp.src('src/**/*.js')
		.pipe(minify({
			ext: {
				src: '.js',
				min: '.min.js'
			}
		}))
		.pipe(gulp.dest('dist/'));
});

// watch
gulp.task('watch', function() {
	watch('src/**/*.js', function() {
		gulp.start('build');
	});
});

gulp.task('default', ['build', 'watch']);