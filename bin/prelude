#!/bin/bash

set -e

prefix=`cat VERSION_PREFIX`
suffix=`build/revision`
version=$prefix.$suffix

sed "s/\$VERSION/$version/g" resources/prelude.txt
