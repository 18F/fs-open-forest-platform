if [ $# -lt 1 ]
then
    echo 'Error: No arguments provided.'
    echo "options:"
    echo "-a  Run authenticated e2e tests. With no other arguments all specs will run. Can also provide space seperated list of specs to run, e.g. e2e/authenticated/christmas-trees/xmas-tree-dates.e2e-spec.ts"
    echo "-u  Run unauthenticated e2e tests. No additional arguments accepted"
else
  FLAG='-a'
  FLAG="$1"
  shift

  ARGUMENTS=''
  case $FLAG in
    -a)
      if [ $# -lt 1 ]
      then
         echo 'No specs provided. Running all specs. To limit the specs to be run, include a space seperated list of specs to run.'
      else
        ARGUMENTS=$ARGUMENTS"--specs "
        for i in "$@"
        do
          ARGUMENTS=$ARGUMENTS"${i},"
        done
      fi
      # ARGUMENTS=$ARGUMENTS"--protractor-config ./development-configurations/protractor.conf.js"
      ;;
    -u)
      if [ $# -ge 1 ]
      then
        echo 'No spec arguments accepted with -u flag. Ignoring all other arguments provided.'
      fi

      #Rebuild server with PLATFORM set to something other than local to enable test to pass
      export PLATFORM='ci-unauthenticated'

      ARGUMENTS=$ARGUMENTS"--protractor-config ./development-configurations/unauth-protractor.conf.js"
      ;;
    *)
      echo 'Valid flag indicating which mode to run this script in must be provided as the first argument.'
      echo '-a runs script with test user authenticated'
      echo '-u runs script with test user not authenticated'
      exit 1
      ;;
  esac
  echo $ARGUMENTS;
  cd server;
  yarn start &
  serverid=$!
  sleep 1
  cd ../frontend;
  sudo yarn e2e:ci $ARGUMENTS;

  e2ereturncode=$?

  if [[ $e2ereturncode = 0 ]]
  then
    echo 'SUCCESS'
  else
    echo 'FAIL'
  fi
  kill -int $serverid
  exit $e2ereturncode
fi
