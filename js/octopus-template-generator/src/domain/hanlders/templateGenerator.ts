import NonInteractiveAdapter from "../yeoman/adapter";
import enableNpmInstall from "../features/enbaleNpmInstall";
import splitGeneratorName from "../utils/generatorSplitter";

const yeoman = require('yeoman-environment');
const fs = require('fs');
const os = require('os');
const path = require('path');
const AdmZip = require("adm-zip");
const lockFile = require('lockfile');
const {exec} = require('child_process');
const md5 = require("md5")

export class TemplateGenerator {
    constructor() {
    }

    /**
     * Build a file system safe hash that represents the generator and the specified options.
     * @param generator The name of the Yeoman generator.
     * @param options The options applied to the generator.
     * @param arguments The arguments applied to the generator.
     * @param args The arguments applied to the generator.
     * @param answers The answers applied to the generator.
     * @private
     */
    private async getTemplateId(
        generator: string,
        options: { [key: string]: string; },
        answers: { [key: string]: string; },
        args: string[]): Promise<string> {
        const id = generator
            + Object.keys(options || {}).sort().map(k => k + options[k]).join("")
            + Object.keys(answers || {}).sort().map(k => k + answers[k]).join("")
            + Object.keys(args || []).sort().join("");
        const hash = md5(id);
        return new Buffer(hash).toString('base64');
    }

    /**
     * Returns the path to a cached templated if it exists.
     * @param id The has of the generator and options generated by getTemplateId()
     */
    async getTemplate(id: string): Promise<string> {
        // This is where the template is created
        const zipPath = path.join(os.tmpdir(), id + '.zip');

        // If the template does nopt exist, build it
        if (fs.existsSync(zipPath)) {
            return zipPath;
        }

        return "";
    }

    /**
     * Build the template and return the path to the ZIP file.
     * @param generator The name of the generator.
     * @param options The generator options.
     * @param answers The generator answers.
     * @param args The generator arguments.
     */
    async generateTemplateSync(
        generator: string, options: { [key: string]: string; },
        answers: { [key: string]: string; },
        args: string[]): Promise<string> {

        // Create a hash based on the generator and the options
        const hash = await this.getTemplateId(generator, options, answers, args);
        // This is where the template is created
        const zipPath = path.join(os.tmpdir(), hash + '.zip');

        await this.buildNewTemplate(generator, options, answers, args, zipPath);

        return zipPath;
    }

    /**
     * Generate a template in a background operation, and return the hash for use with getTemplate().
     * @param generator The name of the generator.
     * @param options The generator options.
     * @param answers The generator answers.
     * @param args The generator arguments.
     */
    async generateTemplate(
        generator: string,
        options: { [key: string]: string; },
        answers: { [key: string]: string; },
        args: string[]): Promise<string> {

        // Create a hash based on the generator and the options
        const hash = await this.getTemplateId(generator, options, answers, args);
        // This is where the template is created
        const zipPath = path.join(os.tmpdir(), hash + '.zip');

        // trigger the build, but don't wait for it
        this.buildNewTemplate(generator, options, answers, args, zipPath)
            .catch(e => console.log(e));

        return hash;
    }

    /**
     * Build the template and save it in a temporary directory.
     * @param generator The name of the generator.
     * @param options The generator options.
     * @param answers The generator answers.
     * @param args The generator argumnets.
     * @param zipPath The path to save the template to.
     */
    buildNewTemplate(
        generator: string,
        options: { [key: string]: string; },
        answers: { [key: string]: string; },
        args: string[],
        zipPath: string) {
        const lockFilePath = zipPath + ".lock";
        return new Promise((resolve, reject) => {
            lockFile.lock(lockFilePath, (err: never) => {
                if (err) return reject(err);

                if (!fs.existsSync(zipPath)) {
                    return resolve(this.writeTemplate(generator, options, answers, args, zipPath));
                }

                resolve(zipPath);
            })
        })
            .finally(() => lockFile.unlock(lockFilePath, (err: never) => {
                if (err) {
                    console.error('TemplateGenerator-GenerateTemplate-UnlockFail: Failed to unlock the file: ' + err)
                }
            }));
    }

    /**
     * Write the template to a file.
     * @param generator The name of the generator.
     * @param options The generator options.
     * @param answers The generator answers.
     * @param args The generator arguments.
     * @param zipPath The path to save the generator ZIP file to.
     * @private
     */
    private async writeTemplate(
        generator: string,
        options: { [key: string]: string; },
        answers: { [key: string]: string; },
        args: string[],
        zipPath: string) {

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "template"));

        // sanity check the supplied arguments
        const fixedArgs = !!args && Array.isArray(args)
            ? args
            : [];

        const fixedOptions = options
            ? options
            : {};

        const fixedAnswers = answers
            ? answers
            : {};

        const cwd = process.cwd();

        try {
            const env = yeoman.createEnv({cwd: tempDir}, {}, new NonInteractiveAdapter(fixedAnswers));
            env.register(await this.resolveGenerator(generator), generator);

            // Not all generators respect the cwd option passed into createEnv
            process.chdir(tempDir);
            // eslint-disable-next-line @typescript-eslint/naming-convention
            await env.run([generator, ...fixedArgs], {...fixedOptions, 'skip-install': true});

            const zip = new AdmZip();
            zip.addLocalFolder(tempDir);
            zip.writeZip(zipPath);

            return zipPath;
        } finally {
            process.chdir(cwd);
            try {
                fs.rmSync(tempDir, {recursive: true});
            } catch (err) {
                console.error('TemplateGenerator-Template-TempDirCleanupFailed: The temporary directory was not removed because' + err)
            }
        }
    }

    /**
     * Resolve the Yeoman generator, and optionally try to install it if it doesn't exist.
     * @param generator The name of the generator.
     * @param attemptInstall true if we should attempt to install the generator if it doesn't exist. Note the downloading
     * of additional generators is also defined by the enableNpmInstall() feature.
     * @private
     */
    private async resolveGenerator(generator: string, attemptInstall = true): Promise<string> {
        const generatorId = splitGeneratorName(generator);

        try {
            return require.resolve(generatorId.name + "/generators/" + generatorId.subGenerator);
        } catch (e) {
            /*
             If the module was not found, we allow module downloading, and this is the first attempt,
             try downloading the module and return it.
             */
            if (e.code === "MODULE_NOT_FOUND" && enableNpmInstall() && attemptInstall) {
                console.log("Attempting to run npm install " + generatorId.name);
                return new Promise((resolve, reject) => {
                    exec("npm install " + generatorId.name, (error: never) => {
                        if (error) {
                            return reject(error);
                        }

                        return resolve(this.resolveGenerator(generator, false));
                    });
                });
            }

            throw e;
        }
    }
}
