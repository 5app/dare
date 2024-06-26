#!/usr/bin/env bash

# What does this script do?
# 1. changes directory to test/integration
# 2. exports all the db connection settings for use in nodejs/mocha
# 3. brings up docker-compose (mysql) and waits until ready
# 4. creates a new db into which the /data/data.sql is imported
# 5. mocha integration tests run (they will build and populate the test DBs from those files beforeEach test)
# 6. if KEEP_DOCKER=1 is set, docker-compose isn't pulled down after

set -e
# set -x

node --version

CURR_SCRIPT_RELATIVE="${BASH_SOURCE[0]}"
CURR_DIR_RELATIVE="$(dirname "${CURR_SCRIPT_RELATIVE}")"
INTEGRATION_TEST_DIR="$(cd "${CURR_DIR_RELATIVE}" >/dev/null 2>&1 && pwd)/"
echo "INTEGRATION_TEST_DIR=${INTEGRATION_TEST_DIR}"
# Changing to this dir means docker-compose will use the correct docker-compose.yml file.
# As an alternative we could pass the file with -f flag, but then we have to remember to add it to every
# docker-compose command (including those invoked from within nodejs/mocha beforeEach).
# Could always move the docker-compose file to the root (dashboardV2/)
cd "$INTEGRATION_TEST_DIR" || exit 1

MYSQL_ROOT_USER="root"
MYSQL_ROOT_PASSWORD="test_pass"
MYSQL_VERSION=${MYSQL_VERSION:-5.7.40}

export TEST_DB_SCHEMA_PATH="${INTEGRATION_TEST_DIR}data/schema.sql"
export TEST_DB_DATA_PATH="${INTEGRATION_TEST_DIR}data/data.sql"
export TEST_STATE_CLEANUP_MODE=${TEST_STATE_CLEANUP_MODE:-remove}
export MYSQL_USER="mysqluser"
export MYSQL_PASSWORD="password"
export MYSQL_HOST="127.0.0.1"
export MYSQL_PORT=3308

export TZ="UTC"

docker rm -vf "dare_mysql"

echo "Starting mysql:$MYSQL_VERSION"

docker run \
  --name="dare_mysql" \
  --tmpfs=/var/lib/mysql \
  -d \
  -p 3308:3306 \
  --env MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}" \
  --env MYSQL_DATABASE="dare" \
  --env MYSQL_USER="${MYSQL_USER}" \
  --env MYSQL_PASSWORD="${MYSQL_PASSWORD}" \
  --env MYSQL_PORT=3306 \
  --health-cmd="/usr/bin/mysql --user=root -p${MYSQL_ROOT_PASSWORD} --execute=\"SHOW DATABASES;\"" \
  --health-interval="4s" \
  --health-timeout="3s" \
  --health-retries=20 \
  mysql:$MYSQL_VERSION --group-concat-max-len=1000000 --sql-mode="" || {
  echo 'docker run failed'
  exit 1
}

for dep in mysql; do
  echo "waiting for ${dep}..."
  i=0
  until [ "$(docker inspect --format='{{.State.Health.Status}}' "dare_${dep}")" == "healthy" ]; do
    # LOL:
    # using `((i++))` exits the program as it returns 1
    # this only happens on Circle CI
    # this *doesn't* occur when running bash on mac (GNU bash, version 3.2.57(1)-release)
    # NOR when re-running a circle job with SSH (which is crazy!)
    # maybe it's this? https://stackoverflow.com/questions/6877012/incrementing-a-variable-triggers-exit-in-bash-4-but-not-in-bash-3
    # why is circle running two versions of bash!?!?
    i=$((i + 1))
	echo "pending $i";
    sleep 2
    if [[ "$i" -gt '40' ]]; then
      echo "${dep} failed to start. Final status: $(docker inspect --format='{{.State.Health.Status}}' "dare_${dep}")"
      docker rm -v -f "dare_${dep}"
      exit 1
    fi
  done
  sleep 2
  echo "${dep} up"
done

echo 'building template db...'
export TEST_DB_PREFIX="test_"
docker exec -e MYSQL_PWD=${MYSQL_ROOT_PASSWORD} dare_mysql mysql -u${MYSQL_ROOT_USER} -e "GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'%' WITH GRANT OPTION;"

echo 'template db built'

echo 'running tests...'
set +e
(
  # `-x` so we echo the command itself for reference
  set -x
  # $@ proxies all the args to this script to mocha (e.g. for filtering tests etc)
  mocha './**/*.spec.js' "$@"
)
EXIT_CODE=$?
set -e
echo 'tests complete'

if [[ -n "$KEEP_DOCKER" ]]; then
  echo "leaving docker running (detached)"
  if [ "$TEST_STATE_CLEANUP_MODE" == "remove" ]; then
    DBS="$($mysql -e 'SHOW DATABASES')"
    for db in $DBS; do
      if [[ "$db" =~ ^${TEST_DB_PREFIX} ]]; then
        echo "removing test DB: $db"
        $mysql -e "DROP DATABASE $db"
      fi

    done
  fi
else
  echo "shutting down docker..."
  docker rm -v -f "dare_mysql"

fi
echo "finished (tests exit code: $EXIT_CODE)"

exit $EXIT_CODE
