#!/usr/bin/env node

import yeoman from 'yeoman-environment';
import * as fs from "fs";
import path from "path";
import os from "os";
import LoggingAdapter from "./adapter.js";
import buildAdaptiveCard from "./adaptiveCardBuilder.js";
import Environment from "yeoman-environment";

const args = process.argv.splice(2);

if (args.length === 0) {
    console.log("Pass the generator name as the first argument, for example:")
    console.log("yeoman-inspector springboot")
    process.exit(1);
}

/*
    Yeoman does not make it easy to inspect a generator to find the inputs it requires.
    Options and arguments are displayed by the "--help" command, but the questions,
    which typically make up the bulk of any generator inputs, are not listed or
    exposed in any convenient way. It is simply expected that the end user will
    run through the questions one by one as they are asked.

    This doesn't help us when trying to incorporate Yeoman into a more automated
    fail-into-the-pit-of-success workflow where many questions many only have one
    acceptable answer, or where all answers need to be passed in an automated fashion.

    So we need to find hooks into the Yeoman workflow that allow us to reliably
    extract the options, arguments, and questions so they can be extracted and used
    in automated workflows.

    This is necessarily a little hacky given the lack of nice API support for this
    process.
 */

const allQuestions = []

function questionsCallBack(questions) {
    const fixedQuestions = Array.isArray(questions) ? questions : [questions];
    fixedQuestions.forEach(q => allQuestions.push(q));
}

function dumpInputs(options, args, questions) {
    /*
        Dump the options, arguments, and questions.
     */
    console.log("OPTIONS");
    console.log(JSON.stringify(options, null, 2));
    console.log("ARGUMENTS");
    console.log(JSON.stringify(args, null, 2));
    console.log("QUESTIONS");
    console.log(JSON.stringify(questions, null, 2));
    console.log("ADAPTIVE CARD EXAMPLE");
    console.log(JSON.stringify(buildAdaptiveCard(allQuestions), null, 2));
}

const env = yeoman.createEnv(
    {cwd: fs.mkdtempSync(path.join(os.tmpdir(), "template"))},
    {},
    new LoggingAdapter(questionsCallBack));
env.lookup();

Environment.queues = function() {
    return [
        'environment:run',
        'initializing',
        'prompting',
        'configuring',
        'default',
        'transform',
        'conflicts',
        'environment:conflicts',
        'end'
    ];
}

/*
    We can get access to the options and arguments by creating an instance of the
    generator and dumping the private properties "_options" and "_prompts".
 */
const generator = env.create(args[0], args.splice(1), {skipInstall: true, initialGenerator: true});

/*
    Getting access to the questions is a little trickier. We use the LoggingAdapter
    to get access to the questions.
 */
env.run(args[0], {})
    .finally(() => {
        dumpInputs(generator._options, generator._arguments, allQuestions);
    });

