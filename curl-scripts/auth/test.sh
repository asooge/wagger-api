
API="http://localhost:4741"
URL_PATH="/users/${ID}/test"

curl "${API}${URL_PATH}/" \
  --include \
  --request PATCH \
  --header "Authorization: Token token=${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
    "test": "'"${USER}"'"
  }'

echo
