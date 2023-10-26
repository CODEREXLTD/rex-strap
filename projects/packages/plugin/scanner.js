/**
 * @type replace : A simple utility to quickly replace text in one or more files or globs.
 * @type path : The path module provides utilities for working with file and directory paths.
 * @type del : Delete files and directories using globs
 */
const replace = require( 'replace-in-file' );
const path    = require( 'path' );
const { existsSync, writeFileSync, readFile, mkdirSync }
              = require( 'fs' );
const fs      = require( 'fs-extra' );
const { promisify }
              = require( 'util' );
const del     = require( 'del' );

/**
 * The scanner class
 */
class Scanner {
    /**
     * Gets the full path of where the
     * project is being created
     * @returns {string}
     */
    getFullPath() {
        return path.join( process.cwd() );
    }

    /**
     * Replacer
     * @param pathToFolder - folder to search in
     * @param files - files to replace
     * @param from - target to replace
     * @param to - the replacement
     * @returns {Promise<*>}
     */
    async replacer( files, from, to, pathToFolder ) {
        return replace( {
            files:  files,
            from:   from,
            to:     to,
            ignore: [
                path.join( `${ pathToFolder }/node_modules/**/*` ),
                path.join( `${ pathToFolder }/vendor/**/*` ),
                path.join( `${ pathToFolder }/packages/**/*` ),
            ],
        } )
    }

    /**
     * Removes folder
     * @param folder
     * @returns {Promise<void>}
     */
    async removeFolder( folder ) {
        try {
            await fs.remove( folder )
        } catch ( err ) {
            console.error( err )
        }
    }

    /**
     * https://github.com/adamreisnz/replace-in-file
     * @param data
     * @param projectPath
     * @returns {Promise<void>}
     */
    async searchReplace( data, projectPath ) {
        const phpFiles         = [
            path.join( projectPath, 'the-plugin-name.php' ),
            path.join( projectPath, 'includes', 'Abstracts', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Admin', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Assets', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Common', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Databases', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Hooks', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Rest', '**', '*.php' ),
            path.join( projectPath, 'includes', 'Setup', '**', '*.php' )
        ];

        const codesnifferFiles = [
            path.join( projectPath, 'phpcs.xml' ),
        ];

        const composerFile     = path.join( projectPath, 'composer.json' );
        const pathEntryFile    = path.join( projectPath, `the-plugin-name.php` );
        const gruntFile        = path.join( projectPath, `Gruntfile.js` );
        const phpUnitBootstrapFile = path.join( projectPath, 'tests', 'phpunit', 'bootstrap.php' );

        // PHP Files
        if ( data.projectName && data.description && data.url && data.package &&
            data.author && data.authorEmail && data.license ) {
            /**
             * All occurrences
             */
            await this.replacer( // Plugin name used in file meta, translation functions etc.
                phpFiles, /{{The Plugin Name}}/g, `${ data.projectName }`, projectPath
            );
            await this.replacer( // Plugin description used in main file meta as "Description" for example
                phpFiles, /{{plugin_description}}/g, `${ data.description }`, projectPath
            );
            await this.replacer(  // Plugin url used in main file meta as "Plugin URI" for example
                phpFiles, /{{plugin_url}}/g, `https://${ data.url }`, projectPath
            );
            await this.replacer(  // Package name used in PHP doc @package for example
                phpFiles, /{{the-plugin-name}}/g, `${ data.package }`, projectPath
            );
            await this.replacer(  // Package name used in the webpack package.json in the translate script
                phpFiles, /{{the-project-name}}/g, `${ data.package }`, projectPath
            );
            await this.replacer(  // Plugin author used in PHP doc @author for example
                phpFiles, /{{author_name}}/g, `${ data.author }`, projectPath
            );
            await this.replacer(  // Plugin author used in PHP doc @author for example
                phpFiles, /{{version}}/g, `${ data.pluginVersion }`, projectPath
            );
            await this.replacer(  // Plugin author email used in PHP doc @author for example
                phpFiles, /{{author_email}}/g, `${ data.authorEmail }`, projectPath
            );
            await this.replacer(  // Plugin author link used in PHP doc @link for example
                phpFiles, /{{author_url}}/g, `https://${ data.url }`, projectPath
            );
            await this.replacer(  // Plugin copyright used in PHP doc @copyright for example
                phpFiles, /{{author_copyright}}/g, `${ new Date().getFullYear() } ${ data.projectName }`, projectPath
            );
            await this.replacer(  // Plugin license used in PHP doc @licence for example
                phpFiles, /{{author_license}}/g, `${ data.license }`, projectPath
            );

            /**
             * Plugin main class name
             */
            await this.replacer(
                phpFiles, /ThePluginName/g, `${ data.namespace }`, projectPath
            );


            /**
             * Namespace
             */
            await this.replacer(  // File namespace
                phpFiles, /namespace ThePluginName/g, `${ 'namespace ' + data.namespace }`, projectPath
            );
            await this.replacer(  // Namespace called in various occurrences
                phpFiles, /ThePluginName\\/g, `${ data.namespace + '\\' }`, projectPath
            );



            /**
             * Meta
             */
            await this.replacer(  // PHP plugin meta text domain in "the-plugin-name.php"
                phpFiles,
                /^ \* Text Domain:.*$/m, ` * Text Domain:     ${ data.package }`, projectPath
            );
            await this.replacer(  // PHP plugin meta text namespace in "the-plugin-name.php"
                phpFiles,
                /^ \* Namespace:.*$/m, ` * Namespace:       ${ data.namespace }`, projectPath
            );

            /**
             * Translation functions
             */
            await this.replacer(  // text domain in translation functions
                phpFiles, /the-plugin-name-text-domain/g, `${ data.package }`, projectPath
            );

            
            /**
             * Rest api class map
             */
            await this.replacer(
                phpFiles, /plugin_name_rest_api_class_map/g, `${ data.prefix + '_rest_api_class_map ' }`, projectPath
            );

            /**
             * Functions, constants, variables
             */
            await this.replacer(  // Constants with prefixes
                phpFiles, /_PLUGIN_NAME_/g, `${ data.prefix + '_' }`, projectPath
            );
            await this.replacer(  // File or global variables with prefixes
                phpFiles, /\$plugin_name_/g, `${ '$' + data.lowerCasePrefix + '_' }`, projectPath
            );
            await this.replacer(  // File or global variables with prefixes
                phpFiles, /plugin_name_/g, `${ data.lowerCasePrefix + '_' }`, projectPath
            );
            await this.replacer(  // Rename the main function on main plugin file
                phpFiles, /the_plugin_name_main_function/g, `${ data.lowerCasePrefix}`, projectPath
            );
            await this.replacer(  // Replace slug 
                phpFiles, /plugin_name-slug/g, `${ data.lowerCasePrefix}`, projectPath
            );
        }


         /**
         * Composer.json
         */
         await this.replacer(
            composerFile, /ThePluginName\\/g, `${ data.namespace }\\`, projectPath
        );

        /**
         * Modify composer.json dependencies based on prior conditions
         */
        const readComposer = promisify( readFile );
        const composerData = JSON.parse( await readComposer( composerFile, 'utf-8' ) );
        writeFileSync( composerFile, JSON.stringify( composerData, null, 4 ) );


        /**
         * PHPCodeSniffer ~ PHPCS
         */
        await this.replacer(
            codesnifferFiles, /<ruleset name="The Plugin Name ruleset">/g, `<ruleset name="${ data.projectName } ruleset">`, projectPath
        );
        await this.replacer(
            codesnifferFiles, /<description>Generally-applicable sniffs for The Plugin Name.<\/description>/g, `<description>Generally-applicable sniffs for ${ data.projectName }.</description>`, projectPath
        );
        await this.replacer(
            codesnifferFiles, /<element value="ThePluginName"\/>/g, `<element value="${ data.namespace }"/>`, projectPath
        );
        await this.replacer(
            codesnifferFiles, /<element value="_THE_PLUGIN_NAME"\/>/g, `<element value="${ data.prefix }"/>`, projectPath
        );
        await this.replacer(
            codesnifferFiles, /<element value="the_plugin_name"\/>/g, `<element value="${ data.lowerCasePrefix }"/>`, projectPath
        );
       
        await this.replacer(
            codesnifferFiles, /<element value="the-plugin-name-text-domain"\/>/g, `<element value="${ data.package }"/>`, projectPath
        );


        /**
         * Rename the plugin entry file
         */
        if ( await fs.pathExists( pathEntryFile ) ) {
            fs.rename( pathEntryFile, path.join( projectPath, `${ data.package }.php` ) );
        }

        const TranslationFile = path.join( projectPath, 'languages', 'the-plugin-name-text-domain.pot' );

        /**
         * Change translation file
         */
        await this.replacer(
            TranslationFile, /the-plugin-name.php/g, `${ data.package }.php`, projectPath
        );

        /**
         * Rename the translation file
         */
        if ( await fs.pathExists( TranslationFile ) ) {
            fs.rename( TranslationFile, path.join( projectPath, 'languages', `${ data.package }.pot` ) );
        }


        /**
         * Replace on Grunt file
         */
        await this.replacer(
            gruntFile, /the-plugin-name-text-domain/g, `${data.package}`, projectPath
        );
        await this.replacer(
            gruntFile, /the-plugin-name-text-domain.pot/g, `${data.package}.pot`, projectPath
        );
        await this.replacer(
            gruntFile, /{{the-plugin-name}}/g, `${data.package}`, projectPath
        );
        await this.replacer(  // Plugin url used in main file meta as "Plugin URI" for example
            gruntFile, /{{plugin_url}}/g, `https://${ data.url }`, projectPath
        );
        await this.replacer(  // Plugin author email used in PHP doc @author for example
            gruntFile, /{{author_email}}/g, `${ data.authorEmail }`, projectPath
        );

        await this.replacer( 
            phpUnitBootstrapFile, /rex_plugin_boilerplate/g, `${ data.package }`, projectPath
        );
    }

}

module.exports = { Scanner };