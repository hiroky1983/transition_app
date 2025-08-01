from notion_client import Client as NotionClient
from typing import Dict, Any

class NotionService:
    def __init__(self, api_key: str, database_id: str):
        self.client = NotionClient(auth=api_key)
        self.database_id = database_id

    def search_by_name(self, name_ja: str) -> Dict[str, Any]:
        response = self.client.databases.query(
            database_id=self.database_id,
            filter={
                "property": "name_ja",
                "rich_text": {
                    "contains": name_ja
                }
            }
        )

        if response["results"]:
            result = response["results"][0]
            return {
                "translatedText": result["properties"]["name_vi"]["title"][0]["text"]["content"],
                "tag": result["properties"]["tag"]["multi_select"][0]["name"],
                "name_ja": result["properties"]["name_ja"]["rich_text"][0]["text"]["content"]
            }
        return None

    def get_all_vocabulary(self) -> Dict[str, Any]:
        """Notionデータベースから全ての単語帳データを取得"""
        response = self.client.databases.query(
            database_id=self.database_id,
            sorts=[
                {
                    "property": "name_ja",
                    "direction": "ascending"
                }
            ]
        )
        
        vocabulary_list = []
        for result in response["results"]:
            try:
                vocabulary_item = {
                    "id": result["id"],
                    "name_ja": result["properties"]["name_ja"]["rich_text"][0]["text"]["content"] if result["properties"]["name_ja"]["rich_text"] else "",
                    "name_vi": result["properties"]["name_vi"]["title"][0]["text"]["content"] if result["properties"]["name_vi"]["title"] else "",
                    "tag": result["properties"]["tag"]["multi_select"][0]["name"] if result["properties"]["tag"]["multi_select"] else ""
                }
                vocabulary_list.append(vocabulary_item)
            except (KeyError, IndexError, TypeError):
                # データが不完全な場合はスキップ
                continue
        
        return {
            "vocabulary_list": vocabulary_list,
            "total_count": len(vocabulary_list)
        }

    def create_page(self, title: str, name_ja: str, genre: str) -> Dict[str, Any]:
        response = self.client.pages.create(
            **{
                "parent": {
                    "database_id": self.database_id
                },
                "properties": {
                    "name_vi": {
                        "title": [
                            {
                                "text": {
                                    "content": title
                                }
                            }
                        ]
                    },
                    "name_ja": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": name_ja
                                }
                            }
                        ]
                    },
                    "tag": {
                        "multi_select": [
                            {
                                "name": genre
                            }
                        ]
                    }
                }
            }
        )
        return response 