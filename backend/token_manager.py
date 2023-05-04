import os
from dotenv import load_dotenv

import jwt

class TokenManager:

    def __init__(self, config_file):
        try:
            dotenv_path = os.path.join(os.path.dirname(__file__), config_file)
            if os.path.exists(dotenv_path):
                load_dotenv(dotenv_path)

            self.__expiration_time = os.environ.get('token_expiration_time')
            self.__secret_key = os.environ.get('token_secret_key')
            self.__algorithm = os.environ.get('token_algorithm')

        except Exception as e:
            print(e)

    def create_token(self, user_id):
        token = jwt.encode(
            {"id": user_id},
            self.__secret_key,
            algorithm=self.__algorithm,
            headers={"exp": self.__expiration_time}
        )

        return token

    def verify_token(self, token, user_id):
        try:
            payload = jwt.decode(token, self.__secret_key, algorithms=[self.__algorithm])
            if user_id != payload['id']:
                return "Вы не авторизованы. Выполните вход/регистрацию"
        except jwt.ExpiredSignatureError:
            return "Вы не авторизованы. Выполните вход/регистрацию"

        return None