/*
  Based on gulp-wp-bump: However I think the person who wrote that plugin didn't understand stream either.
  I wanted to be able to use multiple files to be bumped. However, when I use streams a done in gulp-wp-bump, only one file would be saved.
  I have no clue how to use stream but it seems obvious that the stream is holding whatever was used before in the gulp pipe.
  Since we are changing files outside of the pipe, the stream seems to be uncessary.
  So I just call transform (because I don't know what else to call) and return, while the FS changes the files you passed in as arguments.

  Please refactor if you know what you are doing :)!
*/

var gulp = require( "gulp" );
var stream = require( "stream" );
var path = require( "path" );
var fs = require( "fs" );
var gutil = require( "gulp-util" );
var crypto = require( "crypto" );

var opts;
module.exports = function ( filename, options ) {
  const defOptions = {
    keys: [ 'wp_enqueue_style', 'wp_enqueue_script' ],
    silent: true
  }
  opts = { ...defOptions, ...options };

  let files = [];
  if ( filename instanceof ( Array ) ) {
    files = [ ...filename ];
  } else if ( typeof ( filename ) === 'string' ) {
    files.push( filename );
  }

  files.forEach( file => {
    handleFile( file );
  } );

  // Note: I have no idea what I am doing with this stream. All I know that if I return a stream gulp will not complain
  // and it doesn't seem to interfere with the previous gulp pipes.
  var gulpStream = new stream.Transform( { objectMode: true } );
  gulpStream._transform = function ( file, unused, callback ) {
    callback();
  }
  return gulpStream;
}

function handleFile( filename ) {

  try {
    var file = fs.statSync( filename );

    if ( !file.isFile() ) {
      throw new gutil.PluginError(
        "gulp-wp-bump-all",
        "Requires valid php file"
      );
    }
  } catch ( e ) {
    throw new gutil.PluginError( "gulp-wp-bump-all", "Requires valid php file" );
  }

  fs.readFile( filename, { encoding: "utf-8" }, function ( err, data ) {

    if ( err ) {
      gutil.log( "gulp-wp-bump-all", err );
    } else {

      var revisedFile = bumpVersion( data );

      if ( revisedFile == data ) {
        if ( !opts.silent ) {
          gutil.log( `gulp-wp-bump-all: No change made to '${filename}'` );
        }
      }

      fs.writeFile( filename, revisedFile, function ( err ) {
        if ( err ) {
          gutil.log( "gulp-wp-bump-all", err );
        }
      } );
    }
  } );


  function bumpVersion( data ) {

    const regex = new RegExp( `(?:(?:${applyFilterKeys()})\\()(.*)\\)\\\s*;`, 'gm' );

    let m;
    //
    var token = crypto.randomBytes( 7 ).toString( "hex" );
    var source;
    while ( ( m = regex.exec( data ) ) !== null ) {
      // This is necessary to avoid infinite loops with zero-width matches
      if ( m.index === regex.lastIndex ) {
        regex.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      m.forEach( ( match, groupIndex ) => {
        if ( groupIndex === 1 ) {
          source = match;
          let parts = match.split( "," );
          if ( parts.length >= 4 ) {
            parts[ 3 ] = applyToken( parts[ 3 ], token );
          }
          if ( parts.length === 3 ) {
            parts.push( applyToken( "", token ) );
          }
          if ( parts.length === 2 ) {
            parts.push( "array()" );
            parts.push( applyToken( "", token ) );
          }
          if ( !opts.silent ) {
            console.log( `source [${ source }]` );
            console.log( `replace [${ parts.join().trim() }]` );
          }
          data = data.replace( source, ` ${ parts.join().trim() } ` );
        }
      } );
    }
    return data;
  }

  function applyToken( part, token ) {
    let value = part.trim();
    var quotes = value.charAt( 0 ) === '"' ? '"' : "'";
    value = quotes + token + quotes;
    return value;
  }

  function applyFilterKeys() {
    if ( opts.keys && opts.keys instanceof ( Array ) ) {
      return opts.keys.join( '|' );
    }
  }


}