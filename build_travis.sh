#!/bin/sh

# exit with nonzero exit code if anything fails
set -e

# remake the dir
echo "Cleaning up"
rm -rf ./gh-pages/data
mkdir ./gh-pages/data

# call python
python ./get_data.py

# git init
echo "Setting up git"
cd gh-pages
git init

git config user.name "altbdoor"
git config user.email "lancersupraskyline@gmail.com"

# update index html
timestamp=$(date --utc '+%d %B %Y, %R %Z')
sed -i "s/{{ update_date }}/$timestamp/g" ./index.html

# commit
timestamp=$(date '+%Y-%m-%dT%H:%M:%S%z')
git add .
git commit -m "[Travis] updated data on $timestamp"

echo "Pushing"
git push --force --quiet "https://altbdoor:${GH_TOKEN}@github.com/altbdoor/utar-accommodation-list.git" master:gh-pages > /dev/null 2>&1

# bump rawgit
echo "Bumping RawGit"
commit=$(git log --format=format:%H -1)

rawgit_url="http://cdn.rawgit.com/altbdoor/utar-accommodation-list/$commit"
declare -a data_list=("btho" "kp" "sl")

for i in "${arr[@]}"; do
	curl -s -I "$rawgit_url/data/$i.json" > /dev/null
done
