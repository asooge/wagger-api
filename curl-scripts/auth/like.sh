
API="http://localhost:4741"
URL_PATH="/users/${ID}/likes"

curl "${API}${URL_PATH}/" \
  --include \
  --request PATCH \
  --header "Authorization: Token token=${TOKEN}" \
  --header "Content-Type: application/json" \
  --data '{
    "like": "'"${USER}"'"
  }'

echo
