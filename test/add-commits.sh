#!/bin/bash
touch file
for i in $(eval echo {1..$1})
do
  echo $i >> ./file
  git add file
  git commit -m 'Updated file'
done
