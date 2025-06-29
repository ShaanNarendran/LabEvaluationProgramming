const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const dockerConfig = {
    c: {
        image: 'gcc',
        command: (filePath) => `gcc ${filePath} -o /usercode/a.out && /usercode/a.out`
    },
    cpp: {
        image: 'gcc',
        command: (filePath) => `g++ ${filePath} -o /usercode/a.out && /usercode/a.out`
    },
    python: {
        image: 'python',
        command: (filePath) => `python ${filePath}`
    },
    java: {
        image: 'openjdk',
        command: (filePath) => `javac ${filePath} && java Main`
    }
};

async function executeCode(language, sourceCode, testCases) {
    const langConfig = dockerConfig[language];
    if (!langConfig) {
        throw new Error(`Unsupported language: ${language}`);
    }

    // --- UPDATED: Use 'temp' directory ---
    const tempDir = path.resolve(__dirname, '../temp'); 
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // --- Write the main source code file ---
    const fileName = language === 'java' ? 'Main.java' : `code.${language}`;
    const hostFilePath = path.join(tempDir, fileName);
    const containerFilePath = `/usercode/${fileName}`; // This path is INSIDE the container
    fs.writeFileSync(hostFilePath, sourceCode);

    const allStdout = [];
    const allStderr = [];

    for (const testCase of testCases) {
        console.log(`[ExecRunner] Running test case with input: "${testCase.input}"`);

        // --- Write input to a separate file in the 'temp' directory ---
        const inputFilePath = path.join(tempDir, 'input.txt');
        fs.writeFileSync(inputFilePath, testCase.input || '');
        
        // The command now mounts the 'temp' directory but renames it to '/usercode' inside the container
        const commandToExecute = `${langConfig.command(containerFilePath)} < /usercode/input.txt`;
        const fullCommand = `docker run --rm -v "${tempDir}:/usercode" --workdir /usercode ${langConfig.image} sh -c "${commandToExecute}"`;
        
        const { stdout, stderr } = await new Promise((resolve) => {
            exec(fullCommand, { timeout: 10000 }, (error, stdout, stderr) => {
                resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            });
        });

        console.log(`[ExecRunner] Finished | Stdout: "${stdout}" | Stderr: "${stderr}"`);

        allStdout.push(stdout);
        if (stderr) {
            allStderr.push(stderr);
        }
    }

    return { stdout: allStdout, stderr: allStderr.join('\n') };
}

module.exports = { executeCode };