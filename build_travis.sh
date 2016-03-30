#!/bin/sh

# exit with nonzero exit code if anything fails
set -e

# remake the dir
echo "Cleaning dir"
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
timestamp=$(date '+%d %B %Y')
sed -i "s/{{ update_date }}/$timestamp/g" ./gh-pages/index.html

# commit
timestamp=$(date '+%Y-%m-%dT%H:%M:%S%z')
git add .
git commit -m "[Travis] updated data on $timestamp"

echo "Pushing"
git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
