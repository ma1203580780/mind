import {readFile,writeFile} from 'node:fs/promises';
const file=new URL('../src/data/github-projects.json',import.meta.url);
try{
 const headers={Accept:'application/vnd.github+json','User-Agent':'mind-projects'};
 if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
 const response=await fetch('https://api.github.com/repos/ma1203580780/mind',{headers,signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error(`GitHub ${response.status}`);
 const r=await response.json();
 if(r.full_name!=='ma1203580780/mind'||r.private||r.fork)throw Error('Unexpected repository');
 const repos=[{name:r.name,url:r.html_url,description:r.description,stars:r.stargazers_count,forks:r.forks_count,language:r.language,updatedAt:r.pushed_at,homepage:r.homepage,fork:r.fork,archived:r.archived,topics:r.topics}];
 if(!repos.length)throw Error('No public repositories');
 await writeFile(file,JSON.stringify({checkedAt:new Date().toISOString(),repos},null,2)+'\n');
 console.log(`Updated ${repos.length} public projects`);
}catch(error){const cached=JSON.parse(await readFile(file,'utf8'));if(!cached.repos?.length)throw error;console.warn(`Project refresh unavailable; retaining snapshot from ${cached.checkedAt}`);}
