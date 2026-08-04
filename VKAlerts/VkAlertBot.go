package main

import (
	"os"
	"log"
	"strconv"
	"github.com/SevereCloud/vksdk/v3/api"
	"github.com/SevereCloud/vksdk/v3/longpoll-bot"
	"github.com/joho/godotenv"
)




func main(){

	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Проблема с загрузкой .env файла")
	}
		//token 
	token := os.Getenv("VKTOKEN")
	vk := api.NewVK(token)

		//group
	groupidSTR := os.Getenv("GROUP_ID")
	groupid, err := strconv.Atoi(groupidSTR)
		if err != nil{
			log.Fatal("Проблема загрузки группы")
		}
	
		//user
	peer_idSTR := os.Getenv("LOCAL_USER")
	peer_id, err := strconv.Atoi(peer_idSTR)
		if err != nil{
			log.Fatal("Проблема загрузки юзера")
		}

	lp, err := longpoll.NewLongPoll(vk, groupid)
	

	_, err = vk.MessagesSend(api.Params{
    	"peer_id":   peer_id,  
    	"message":   "Бот запущен!",
    	"random_id": 0, 
		  
	})
	if err != nil{
			log.Printf("Проблема отправки сообщени: %v", err)
		}     
	log.Println("Go")

	//бесконечный цикл бота
	err = lp.Run()
if err != nil {
    panic(err)

}

}