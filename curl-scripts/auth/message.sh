
API="http://localhost:4741"
URL_PATH="/users/${ID}/matches/${MATCH}/messages"

curl "${API}${URL_PATH}/" \
  --include \
  --request POST \
  --header "Authorization: Token token=${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
    "text": "'"${TEXT}"'"
  }'

echo
