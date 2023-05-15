mongoimport /docker-entrypoint-initdb.d/stations_with_duration.json --uri mongodb://localhost:27017/rs-route -c stations --drop --jsonArray --maintainInsertionOrder
mongoimport /docker-entrypoint-initdb.d/categories.json --uri mongodb://localhost:27017/rs-route -c categories --drop --jsonArray --maintainInsertionOrder
mongoimport /docker-entrypoint-initdb.d/places_msk_init.json --uri mongodb://localhost:27017/rs-route -c places --drop --jsonArray --maintainInsertionOrder

mongoimport /docker-entrypoint-initdb.d/common_weights.json --uri mongodb://localhost:27017/rs-route -c common_weights --drop --jsonArray --maintainInsertionOrder
mongoimport /docker-entrypoint-initdb.d/uncommon_weights.json --uri mongodb://localhost:27017/rs-route -c uncommon_weights --drop --jsonArray --maintainInsertionOrder