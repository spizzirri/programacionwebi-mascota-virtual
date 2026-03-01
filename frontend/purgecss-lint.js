import { PurgeCSS } from 'purgecss';
import config from './purgecss.config.cjs';

async function runLint() {
    try {
        const purgeCSSResults = await new PurgeCSS().purge(config);
        let totalRejected = 0;

        purgeCSSResults.forEach(result => {
            if (result.rejected && result.rejected.length > 0) {
                console.error(`\x1b[31mUnused CSS found in ${result.file}:\x1b[0m`);
                result.rejected.forEach(selector => {
                    console.error(`  - ${selector}`);
                });
                totalRejected += result.rejected.length;
            }
        });

        if (totalRejected > 0) {
            console.error(`\x1b[31m\nTotal unused selectors: ${totalRejected}\x1b[0m`);
            console.error('\x1b[31mPlease remove these unused styles from your CSS files.\x1b[0m');
            process.exit(1);
        } else {
            console.log('\x1b[32mNo unused CSS found. Great job!\x1b[0m');
            process.exit(0);
        }
    } catch (error) {
        console.error('An error occurred during CSS linting:', error);
        process.exit(1);
    }
}

runLint();
