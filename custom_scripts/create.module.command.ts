import * as yargs from "yargs";
const chalk = require("chalk");
const fs = require('fs-extra');

var argv = yargs
    .usage('Usage: npm run module:create -- -n=[module_name]')
    .alias('n', 'name')
    .describe('n', 'The name of the module (use underscore \'_\' when multiple words)')
    .example('npm run module:create -- -n=dashboard', 'create module named dashboar')
    .demandOption(['n'])
    .argv;

execute(argv);

async function execute(args: yargs.Arguments){

    try {
         
        let moduleName: string = "" + args.name;
        moduleName = moduleName.toLowerCase();

        const path = process.cwd() + "/src/";
        const modulePath = path + moduleName;

        // create directory
        if (fs.existsSync(modulePath)) {
            console.log(chalk.black.bgRed("Module with name " + moduleName + " already exists"));
            process.exit(1);
        } else {
            fs.mkdirSync(modulePath);
        }

        // create controllers dir
        const controllers = modulePath + "/controllers";
        fs.mkdirSync(controllers);

        // create middlewares dir
        const middlewares = modulePath + "/middlewares";
        fs.mkdirSync(middlewares);

        // create entities dir
        const entities = modulePath + "/entities";
        fs.mkdirSync(entities);

        // create repositories dir
        const repositories = modulePath + "/repositories";
        fs.mkdirSync(repositories);
       
        // create utilities dir
        const utilities = modulePath + "/utilities";
        fs.mkdirSync(utilities);

        // create routes file
        const dotSeperated = moduleName.replace(/_/g, '.');
        const fileName = dotSeperated + '.router.ts';
        const filePath = modulePath + "/" + fileName;

        let className = "";
        const nameParts = moduleName.split('_');
        for(const namePart of nameParts){
            className +=  namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }
        
        className = className+ 'Router';

        const routerTemplate = getTemplate(className);

        await fs.writeFile(filePath, routerTemplate);

        console.log(chalk.black.bgGreen(`Module created, register your module routes in app.ts: ${className}.configRoutes(app);`));

    } catch (err) {
        console.log(chalk.black.bgRed("Error during module creation: "));
        console.error(err);
    }
}

/**
 * Gets contents of the entity file.
 */
function getTemplate(className: string): string {
    return `import * as express from "express";

export class ${className} {
    static configRoutes = (app: express.Application) => {

        /**
         * Write your module routes here for ex.
         * app.post('/users', [
         *    UserMiddleware.validateUserInsert,
         *    UserController.insert  
         * ]);
         */
    }
}`;
}
