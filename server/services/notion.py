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
                "audio": result["properties"]["audio"]["files"][0]["external"]["url"],
                "tag": result["properties"]["tag"]["multi_select"][0]["name"],
                "name_ja": result["properties"]["name_ja"]["rich_text"][0]["text"]["content"]
            }
        return None

    def create_page(self, title: str, name_ja: str, genre: str, audio_url: str, blob_name: str) -> Dict[str, Any]:
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
                    },
                    "audio": {
                        "files": [
                            {
                                "name": blob_name,
                                "external": {
                                    "url": audio_url
                                }
                            }
                        ]
                    }
                }
            }
        )
        return response 