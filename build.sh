#!/bin/sh

# exit with nonzero exit code if anything fails
set -e

# remake the dir
rm -rf ./gh-pages/data
mkdir ./gh-pages/data

# call python
python ./get_data.py

# git init
cd gh-pages
git init

git config user.name "altbdoor"
git config user.email "lancersupraskyline@gmail.com"

timestamp=$(date +%Y-%m-%dT%H:%M:%S%z)
git add .
git commit -m "[Travis] updated data on $timestamp"

# git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
