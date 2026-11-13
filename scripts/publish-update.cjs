'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const yaml = require('js-yaml');

function updateFiles(root) {
  const {version} = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const installer = `Vinyl-Setup-${version}.exe`;
  const metadata = yaml.load(fs.readFileSync(path.join(root,'dist','latest.yml'),'utf8'));
  const files = [installer,`${installer}.blockmap`,'latest.yml'].map(name=>{
    const data = fs.readFileSync(path.join(root,'dist',name));
    if (!data.length) throw new Error(`Empty update file: ${name}`);
    return {name,data,size:data.length,digest:`sha256:${crypto.createHash('sha256').update(data).digest('hex')}`};
  });
  const hash = crypto.createHash('sha512').update(files[0].data).digest('base64');
  const entry = metadata.files?.find(file=>file.url===installer);
  if (metadata.version !== version || metadata.path !== installer || metadata.sha512 !== hash || entry?.sha512 !== hash || entry?.size !== files[0].size) {
    throw new Error('Update metadata does not match the installer version, size and SHA-512. Nothing will be published.');
  }
  return {version,files};
}

async function publishUpdate({github,context,core,root=path.join(__dirname,'..')}) {
  if (context.ref !== 'refs/heads/main') throw new Error('Only main can publish automatic updates.');
  const {version,files} = updateFiles(root);
  const repo = context.repo;
  const tag = `v${version}`;
  // Do not turn an older queued build into the newest downloadable update.
  const isCurrent = async()=> (await github.rest.repos.getBranch({...repo,branch:'main'})).data.commit.sha === context.sha;
  if (!await isCurrent()) {core.notice('A newer push is already building. Skipping this outdated update.');return;}
  const releases = await github.paginate(github.rest.repos.listReleases,{...repo,per_page:100});
  let release = releases.find(item=>item.tag_name===tag);
  if (release && release.target_commitish !== context.sha) throw new Error(`Update version ${version} already belongs to another commit.`);
  if (release && !release.draft) {
    core.notice(`Update ${version} has already been published. Leaving its installer untouched.`);
    return;
  }
  if (!release) release = (await github.rest.repos.createRelease({...repo,tag_name:tag,target_commitish:context.sha,name:`Vinyl ${version}`,body:`Automatic Windows build from ${context.sha}.`,draft:true,prerelease:false})).data;
  const assets = await github.paginate(github.rest.repos.listReleaseAssets,{...repo,release_id:release.id,per_page:100});
  for (const file of files) {
    const existing = assets.find(asset=>asset.name===file.name);
    if (existing?.state==='uploaded' && existing.size===file.size && existing.digest===file.digest) continue;
    if (existing) await github.rest.repos.deleteReleaseAsset({...repo,asset_id:existing.id});
    await github.rest.repos.uploadReleaseAsset({...repo,release_id:release.id,name:file.name,data:file.data,headers:{'content-type':'application/octet-stream','content-length':file.size}});
  }
  const uploaded = await github.paginate(github.rest.repos.listReleaseAssets,{...repo,release_id:release.id,per_page:100});
  for (const file of files) {
    const asset = uploaded.find(item=>item.name===file.name);
    if (asset?.state!=='uploaded' || asset.size!==file.size || (asset.digest && asset.digest!==file.digest)) throw new Error(`Upload verification failed for ${file.name}. Update remains unpublished.`);
  }
  if (!await isCurrent()) {core.notice('A newer push arrived during upload. Keeping this build unpublished.');return;}
  await github.rest.repos.updateRelease({...repo,release_id:release.id,draft:false,prerelease:false,make_latest:'true'});
  core.notice(`Vinyl ${version} is ready for automatic download.`);
}
module.exports = {updateFiles,publishUpdate};
