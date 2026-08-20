#!/bin/sh
set -e

# In dev the app source is bind-mounted over the image's copy, so re-sync
# dependencies/autoloader on every start in case composer.json/lock changed
# since the image was built.
if [ "$APP_ENV" = 'dev' ] && [ -f composer.json ]; then
	composer install --prefer-dist --no-progress
fi

if [ "$1" = 'frankenphp' ] || [ "$1" = 'php' ] || [ "$1" = 'bin/console' ]; then
	if [ -z "$SKIP_MIGRATIONS" ]; then
		echo "Waiting for the database to be ready..."
		ATTEMPTS_LEFT_TO_REACH_DATABASE=60
		until [ $ATTEMPTS_LEFT_TO_REACH_DATABASE -eq 0 ] || php bin/console doctrine:query:sql "SELECT 1" >/dev/null 2>&1; do
			ATTEMPTS_LEFT_TO_REACH_DATABASE=$((ATTEMPTS_LEFT_TO_REACH_DATABASE - 1))
			echo "Still waiting for database to be ready... $ATTEMPTS_LEFT_TO_REACH_DATABASE attempts left"
			sleep 1
		done

		if [ $ATTEMPTS_LEFT_TO_REACH_DATABASE -eq 0 ]; then
			echo "The database is not up or not reachable"
			exit 1
		else
			echo "The database is now ready and reachable"
		fi

		php bin/console doctrine:migrations:migrate --no-interaction
	fi
fi

exec "$@"
