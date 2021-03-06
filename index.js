var gulp = require( "gulp" );
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
          gutil.log( `gulp-wp-bump-all: No change made to '${ filename }'` );
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

    const regex = new RegExp( `(?:(?:${ applyFilterKeys() })\\()(.*)\\)\\\s*;`, 'gm' );
    const arrayRegex = new RegExp( 'array\\([^)]*\\)', 'g' );

    let m;
    //
    var token = crypto.randomBytes( 7 ).toString( "hex" );
    var original;
    while ( ( m = regex.exec( data ) ) !== null ) {
      // This is necessary to avoid infinite loops with zero-width matches
      if ( m.index === regex.lastIndex ) {
        regex.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      m.forEach( ( match, groupIndex ) => {
        var result;
        if ( groupIndex === 1 ) {
          original = match;

          // try to match the depedency array string part
          //
          var arrayMatch = match.match( arrayRegex );
          if ( arrayMatch ) {
            // replace the comma's in the dependency array for | so that we can do the split below on comma
            //
            var arrayValue = arrayMatch[ 0 ].replace( /,/g, '|' );
            match = match.replace( arrayMatch[ 0 ], arrayValue );
          }

          let parts = match.split( ',' );

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
          result  = parts.join().trim();
          if ( arrayMatch ) {
            result = result.replace( arrayValue,  arrayMatch[ 0 ] );
          }
          data = data.replace( original, ` ${ result } ` );
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
