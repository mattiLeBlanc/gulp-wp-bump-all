## Gulp-wp-bump-all

Inspired by [gulp-wp-bump](https://www.npmjs.com/package/gulp-wp-bump), which didn't allow me to update multiple files or multiple search keys (enqueue_script and or enqueue_style).

So I made this possible for my own project.

    Note: I am not understanding the bit about streams, and it seems the author of `gulp-wp-bump` didn't either. 
    So if you do understand how it could be done better, please educate me.
    Cheers!

## Install

Install via npm

    npm i gulp-wp-bump-all -D

## Usage

**Bump multiple PHP files in your Wordpress themes or plugins**
The `bump` task is NOT using anything in the stream, since it is just going to amend the files that are mentioned in its arguments.  It is currently just `hooked in`. 

    bump( ['filename' | [array of 'filenames'], {
	    keys: [array of strings],
	    silent: boolean
	} )

	// ************** example **************
	
	var bump = require('gulp-wp-bump-all');
	gulp.task( 'something', function() {
		gulp.src( 'sass/**/*.scss' )
		.pipe( sass().on('error', sass.logError ) )
	    .pipe( bump( 
		    ['lib/core/class-theme.php', 'functions.php' ], 
		    { 
			    keys: [ 'wp_enqueue_style', 'wp_enqueue_script', 'wp_register_style' ], 
			    silent: true
			} 
		) )
		.pipe( gulp.dest('dist/css') );
	} );

In the example I tell `bump` to look through two files and bump the following keys `'wp_enqueue_style', 'wp_enqueue_script', 'wp_register_style'` with a new version (if they can be found.

I am only bumping if:

    // The style or script register/enqueue has a name and file location defined, ergo:
    wp_enqueue_style( 'theme', '/dist/css/style.css' );
    // This will result in:
    wp_enqueue_style( 'theme', '/dist/css/style.css', array(), '[HASH]' );

	wp_enqueue_script( 'theme', '/dist/js/something.js', array( 'jquery' ), '1.0', true );
	// will become
	wp_enqueue_script( 'theme', '/dist/js/something.js', array( 'jquery' ), '[HASH]', true );
	
	wp_enqueue_script( 'jquery' );
	// will be ignored since I am missing the second argument (file location).
	wp_enqueue_script( 'jquery' );

You can define any filename as long as the path is correct. If you do not define filter `keys`,  fallback will be `[ 'wp_enqueue_style', 'wp_enqueue_style]`
    
    

