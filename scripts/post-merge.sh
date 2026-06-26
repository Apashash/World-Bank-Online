#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm tsc --build
pnpm --filter @workspace/db run push
