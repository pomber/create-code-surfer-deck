const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const exec = require("child_process").execSync;
const spawn = require("cross-spawn");

const install = () => {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["install"], {
      stdio: "inherit"
    });
    child.on("close", code => {
      if (code !== 0) {
        reject();
        return;
      }
      resolve();
    });
  });
};

const gitInit = () => {
  exec("git --version", { stdio: "inherit" });
  exec("git init", { stdio: "inherit" });
  exec("git add .", { stdio: "inherit" });
  exec('git commit -am "Init"', { stdio: "inherit" });
  return true;
};
const getTar = ({ user, repo, path = "", name }) => {
  const url = `https://codeload.github.com/${user}/${repo}/tar.gz/master`;
  const cmd = `curl ${url} | tar -xz -C ${name} --strip=3 ${repo}-master/${path}`;
  exec(cmd, { stdio: "inherit" });
};

const create = async (opts = {}) => {
  if (!opts.name) {
    throw new Error("name argument required");
    return;
  }

  if (!opts.template) {
    throw new Error("template argument required");
    return;
  }

  const dirname = path.resolve(opts.name);
  const name = path.basename(dirname);
  const [user, repo, ...paths] = opts.template.split("/");

  fs.ensureDirSync(name);

  getTar(
    Object.assign({}, opts, {
      name,
      user,
      repo,
      path: paths.join("/")
    })
  );

  const templatePkg = require(path.join(dirname, "package.json"));

  const pkg = Object.assign({}, templatePkg, {
    name,
    version: "1.0.0"
  });

  fs.writeFileSync(
    path.join(dirname, "package.json"),
    JSON.stringify(pkg, null, 2) + os.EOL
  );

  process.chdir(dirname);

  const installed = await install();
  const initialized = gitInit();

  exec("npm test", { stdio: "inherit" });
  return { name, dirname };
};

module.exports = create;
