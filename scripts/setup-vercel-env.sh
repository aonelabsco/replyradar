#!/usr/bin/env bash
# Run this once after `vercel login` to push all env vars to Vercel.
# Usage: bash scripts/setup-vercel-env.sh

set -euo pipefail

ENVS=("production" "preview" "development")

add_env() {
  local name="$1"
  local value="$2"
  for env in "${ENVS[@]}"; do
    printf '%s' "$value" | vercel env add "$name" "$env" --force
  done
  echo "✓ $name"
}

echo "=== Pushing env vars to Vercel ==="
echo "(You must have run 'vercel login' and linked this project with 'vercel link' first)"
echo ""

add_env FIREBASE_PROJECT_ID "reply-radar-a1"
add_env FIREBASE_CLIENT_EMAIL "firebase-adminsdk-fbsvc@reply-radar-a1.iam.gserviceaccount.com"
add_env FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwGLoSNVxjpyh9
pCfV3H5yvIdvka4Gtuv0M5yEx7GPA0BvfEYEIEn+Sp6X2YaU3x12vAgyFT3MdeKP
RRNeOJGsHW1K/TQm1WMWMO58w4HbmmVPpKXFT0ePA0FgLPhUUKh1rOpW6UeJ0K85
IqAmiy93aC6JqZBPmi96mD3mQuI8Ji4sfCZZM/sJTgyoEGgIyPp2+BPyPUA8wNGt
+klkn3x43IUgBiYg3x8S01zztlNB1kSgPAu6zIyk/6hzRQTQKwM7m1ucQP9xOTkZ
XS5VFys+3ZqePz5OrYoTLOjDLK/A42BKOCFbgiIzONPdGIrDAVkuVohlFE9iOyDd
mY6J+CkjAgMBAAECggEAEIuKM/rCfvRuJ/vb6EqKsOIIwZFI7gWSvsN4obsXci3m
iHL/KxUTjqpZI0BDVkpuPMEm7fmz8DllO3vMeY5MFYVARwrqMvnakPOw/JTr5wOn
ICgCkTrFKOkv48bl4Boh8ch4zgil+YtbYz1fGa/7Gjd2I+YEEo6Uhmq2aiN/mRH/
LdR8D2AUDD3x0JBKLXLyBrsJKJzbs6tQ1Dot1YlSj04utMZgRn8638Kmi0f9jCOW
TY5hOrd5If+bS+fwFQQn89ivddJApBR5t5TzD8l5fvlW1isMi1PEAC0kk0CwakFf
UMUtIj2v0O9vGV2xXpWWHNN47lZjxJ43BZj69sEM1QKBgQDqYI6ggNBPkrVJ0VP4
whha9uEtyGjR781NX7CvxCxFa8bhsiUvaQK3ILS+FdMbIeHCe0Z3XXCNwyhS0VYx
mc76NoY1PH6Fzg6v3K37kYiViiLhH+cK8+xUdvlk/fdIlMRV0CEnPUShu49n736H
MTo7qBPt83misv24Xxbw94ILtwKBgQDAV7fP5ZAd8shSJglha++xnq+xZe0dD7B0
tpmBW8196THovK5tRobEKQTPeJvSHUnoD2+8mwcljGTYOFe4Vfe3Hcscv8TeByZj
EYsFlR2niz58ENGyFMqXgGxGfh/mz5Vcf8PfOOsTjkoGjhdKlt9jGrjahOxi7fpM
wB2wWrql9QKBgQDBbr9HqAhEJAiKy8BJ5abELEzbxDL+ULNX0Em6RmVjRff1/VjD
MB+Vk+CXoNuB4Qy5vZQCn5Ns7EwzTaGdfhtcVfOdrDefpthoO/E7VnkrMb5nnjTI
zVeWvjpGJ3QW6vC/Ae7au64Q7QMF/JqoaPBum+EW2YLhzGep6pC8fwlNMQKBgAva
nBp09G/UEaJ2c6eMZmZU+FD/jiB3YhGfW1CMntp+r7O/RSS47v9R49kBfuDxKyfh
I6rFByi6QVDOECHtMmoXrPflnbVtTWFXqHC8ouo7e6tbwgCupVm28XVauo6YBoV/
3kt4j4xR/Z/vy+Gt8LCD6haVkJf8QKvQP0QqI0ytAoGACZmyyXoDpj/5ZktAPCll
k74v02gJgOCshUX7QJvOlS8EXVDR86ayEhEy0fHt3RYUaR+RBm6M5poqfnhaQLc/
PH/De8uIm36vvpEbqfi5uD68eNYhEWwpqcc1nkeJN5reL5cJb3lTjwavUCKDbHCV
fXkwMc0mH5aNBIn+xaHzw4Y=
-----END PRIVATE KEY-----"

echo ""
echo "Firebase vars pushed. You still need to add:"
echo "  APP_PASSWORD        — your team password"
echo "  ANTHROPIC_API_KEY   — for phase 4"
echo "  APIFY_TOKEN         — for phase 4"
echo ""
echo "Add them with: printf 'value' | vercel env add VAR_NAME production"
