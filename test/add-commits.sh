#!/bin/bash
touch file
for i in {1..30}
do
  echo change >> ./file
  git add file
  git commit -m 'Updated file'
done
