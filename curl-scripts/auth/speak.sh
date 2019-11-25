
API="http://localhost:4741"
URL_PATH="/users/${ID}/speak"

curl "${API}${URL_PATH}/" \
  --include \
  --request POST \
  --header "Authorization: Token token=${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
    "speak": "'"${SPEAK}"'"
  }'

echo
