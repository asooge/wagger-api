
API="http://localhost:4741"
URL_PATH="/users/${ID}/matches"

curl "${API}${URL_PATH}/" \
  --include \
  --request DELETE \
  --header "Authorization: Token token=${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
    "match": "'"${USER}"'"
  }'

echo
