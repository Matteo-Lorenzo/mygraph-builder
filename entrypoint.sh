#!/bin/sh
echo "Starting the application..."

echo "Waiting for postgres..."

while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"

if [ "$SEED_DB" = "yes" ]
then
  node /opt/mygraph/dist/src/utilities/seed.js
fi


exec "$@"
