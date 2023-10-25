#!/usr/bin/env node
/**
 * @type path : The path module provides utilities for working with file and directory paths.
 */
const path = require( 'path' );

/**
 * @type Terminal : Setup that clears the terminal, set intro, predefined answers etc.
 * @type Operator : Prompts and process questions/answers, repo cloning, dependencies install & clean-up
 * @type Logger : Log text to user during project creation with needed colors if necessary
 */
const {
          terminal: { Terminal },
          operator: { Operator },
          logger:   { Logger },
      } = require( '../controllers' );

/**
 * @type Scanner : Get the project path after cloning repo, do search and replace, and deps install
 * @type Questions : Questions that the operator prompts
 */
const {
          scanner:   { Scanner },
          questions: { Questions, QuestionsWebpack },
      } = require( '../packages/plugin' );

/**
 * @docs http://yargs.js.org/docs/#api-reference-demandcommandmin1-max-minmsg-maxmsg
 * @type exports.command : Defines the command name for Yargs when running strap.js
 * @type exports.desc : Defines the command description for Yargs when running strap.js
 * @type exports.builder : Uses the questions to build the commands
 * @type exports.handler : Handler function, which will execute the terminal
 */
exports.command = 'plugin';
exports.desc    = 'Create a new WP plugin. Should be run inside your plugins folder (wp-content/plugins).';
exports.builder = Questions;
exports.handler = async ( argv ) => {

    /**
     * Initialize the terminal, operator,
     * logger, and scanner controllers
     */
    const terminal = new Terminal();
    const operator = new Operator();
    const scanner  = new Scanner();
    const log      = new Logger();

    /**
     * Clear terminal, set intro and set
     * predefined answers from users input
     */
    await terminal.clear();
    await terminal.setIntro();
    await terminal.setPredefinedAnswers( Questions, argv );

    /**
     * Prompt user with unanswered questions
     * and get the project path where the git
     * project gets cloned to
     */
    const promptedInfo = await operator.prompt( Questions, argv );
    const projectPath  = path.join( scanner.getFullPath(), promptedInfo.package );
    log.message( '' );

    /**
     * Clone the plugin git repo into the
     * project path and set next step
     */
    await terminal.install( {
        describe: `${ terminal.step }. Operator is cloning plugin repository`,
        event:    operator.getRepo( 'https://github.com/CODEREXLTD/rex-plugin-boilerplate', projectPath ),
    } );
    terminal.setNextStep();

    /**
     * Replacing plugin data
     * and set next step
     */
    await terminal.install( {
        describe: `${ terminal.step }. Operator is replacing plugin data`,
        event:    scanner.searchReplace( promptedInfo, projectPath ),
    } );
    terminal.setNextStep();

    

    /**
     * Install composer dependencies
     * and set next step
     */
    await terminal.install( {
        describe: `${ terminal.step }. Operator is installing Composer dependencies. This may take a while...`,
        event:    operator.install( 'composer', projectPath ),
    } );
    terminal.setNextStep();

    /**
     * Install
     * and set next step
     */
    await terminal.install( {
        describe: `${ terminal.step }. Operator is cleaning up`,
        event:    operator.cleanUp( projectPath ),
    } );
    terminal.setNextStep();

    /**
     * Final message
     */
    log.message( '----------------' );
    log.message( `${ log.validation( '✔' ) } Project is created` );
    log.message( '' );
    log.message( 'The plugin data, namespace, prefixes has been changed according to your input.' );
    log.message( '' );
    log.message( '' );
    log.message( `You will find a new plugin in your plugin folder. Navigate to that folder and run the following command:` );
    log.message( 'npm install' );
    log.message( 'npm run production' );
    log.message( '' );
    log.message( '' );
    log.message( `You can activate the plugin in WordPress and work on it straight away. Good luck!` );
    log.message( '----------------' );
    process.exit( 0 );
};