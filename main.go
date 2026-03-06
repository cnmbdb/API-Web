package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/joho/godotenv"
	"github.com/xssnick/tonutils-go/address"
	"github.com/xssnick/tonutils-go/liteclient"
	"github.com/xssnick/tonutils-go/tlb"
	"github.com/xssnick/tonutils-go/ton"
	"github.com/xssnick/tonutils-go/ton/wallet"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type PaymentService struct {
	Hash     string
	Cookie   string
	apiURL   string
	Mnemonic string
}

type RequestPayload struct {
	Query      string
	Months     int
	Recipient  string
	ID         string
	ShowSender int
	Method     string
}
type EventsResponse struct {
	Transactions []Transaction `json:"transactions"`
}

type Transaction struct {
	Account     string      `json:"account"`
	Hash        string      `json:"hash"`
	Lt          string      `json:"lt"`
	Now         int64       `json:"now"`
	OrigStatus  string      `json:"orig_status"`
	EndStatus   string      `json:"end_status"`
	TotalFees   string      `json:"total_fees"`
	Description Description `json:"description"`
	InMsg       Message     `json:"in_msg"`
	OutMsgs     []Message   `json:"out_msgs"`
}

type Description struct {
	Type     string   `json:"type"`
	Action   Action   `json:"action"`
	Aborted  bool     `json:"aborted"`
	CreditPh CreditPh `json:"credit_ph"`
}

type Action struct {
	Valid           bool   `json:"valid"`
	Success         bool   `json:"success"`
	NoFunds         bool   `json:"no_funds"`
	ResultCode      int    `json:"result_code"`
	TotActions      int    `json:"tot_actions"`
	MsgsCreated     int    `json:"msgs_created"`
	TotalFwdFees    string `json:"total_fwd_fees"`
	SkippedActions  int    `json:"skipped_actions"`
	TotalActionFees string `json:"total_action_fees"`
}

type CreditPh struct {
	Credit string `json:"credit"`
}

type Message struct {
	Hash           string         `json:"hash"`
	Source         string         `json:"source"`
	Destination    string         `json:"destination"`
	Value          string         `json:"value"`
	MessageContent MessageContent `json:"message_content"`
}

type MessageContent struct {
	Body    string  `json:"body"`
	Decoded Decoded `json:"decoded"`
}

type Decoded struct {
	Type    string `json:"type"`
	Comment string `json:"comment"`
}

func checkForMatchingEvent(address, ref string) (string, error) {
	url := fmt.Sprintf("https://toncenter.com/api/v3/transactions?account=%s&limit=10", address)

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to fetch events: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	var eventsResponse EventsResponse
	err = json.Unmarshal(body, &eventsResponse)
	if err != nil {
		return "", fmt.Errorf("failed to parse JSON: %v", err)
	}
	// 查找匹配的comment
	for _, transaction := range eventsResponse.Transactions {
		for _, outMsg := range transaction.OutMsgs {
			if outMsg.MessageContent.Decoded.Type == "text_comment" {
				lines := strings.Split(strings.TrimSpace(outMsg.MessageContent.Decoded.Comment), "\n")
				lastLine := strings.TrimSpace(lines[len(lines)-1])

				log.Println("Ref:", ref)
				log.Println("Ref:", lastLine)
				// 进行大小写敏感的匹配
				if strings.Contains(lastLine, ref) {

					successInfo := "区块已确认,交易成功! 交易hash: " + transaction.Hash + "\n"
					successInfo += "查看交易: https://tonscan.org/tx/" + transaction.Hash + "\n"
					return successInfo, nil
				}
			}
		}
	}

	return "", fmt.Errorf("no matching event found")
}

func ProcessPremiumGift(amount string, payload string, duration int) (string, error) {
	// Load configuration file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("配置文件加载失败，请检查！", err)
	}

	Duration := strconv.Itoa(duration)
	Mnemonic := os.Getenv("WalletMnemonic")

	if Duration == "" {
		log.Fatal("环境变量 OpenDuration 为空或不存在, 请检查配置文件。")
	}

	// Call transferTon directly
	result, err := transferTon(amount, payload, Mnemonic, Duration)
	if err != nil {
		fmt.Println("Error:", err)
		return "", err
	} else {
		fmt.Println(result)
		return result, nil
	}
}

func main() {
 
	amount := os.Args[1]
	payload := os.Args[2]
	durationStr := os.Args[3]
	//amount := "0.2442"
	//payload := "YOgNU9Mmr"
	//durationStr := "50"

	duration, err := strconv.Atoi(durationStr)
	if err != nil {
		fmt.Println("Invalid duration:", err)
		os.Exit(1)
	}

	result, err := ProcessPremiumGift(amount, payload, duration)
	if err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	} else {
		fmt.Println("Result:", result)
	}
}

func transferTon(amount string, payload string, Mnemonic string, Duration string) (string, error) {
	client := liteclient.NewConnectionPool()
	addresses := []struct {
		addr      string
		publicKey string
	}{
		{"188.68.216.239:19925", "ucho5bEkufbKN1JR1BGHpkObq602whJn3Q3UwhtgSo4="},
		{"65.21.141.197:13570", "iVQH71cymoNgnrhOT35tl/Y7k86X5iVuu5Vf68KmifQ="},
		{"185.86.79.9:4701", "G6cNAr6wXBBByWDzddEWP5xMFsAcp6y13fXA8Q7EJlM="},
		{"65.21.141.198:47160", "vOe1Xqt/1AQ2Z56Pr+1Rnw+f0NmAA7rNCZFIHeChB7o="},
		{"65.21.141.233:30131", "wrQaeIFispPfHndEBc0s0fx7GSp8UFFvebnytQQfc6A="},
		{"135.181.140.221:46995", "wQE0MVhXNWUXpWiW5Bk8cAirIh5NNG3cZM1/fSVKIts="},
		{"135.181.140.212:13206", "K0t3+IWLOXHYMvMcrGZDPs+pn58a17LFbnXoQkKc2xw="},
		{"5.9.10.15:48014", "3XO67K/qi+gu3T9v8G2hx1yNmWZhccL3O7SoosFo8G0="},
		{"5.9.10.47:19949", "n4VDnSCUuSpjnCyUk9e3QOOd6o0ItSWYbTnW3Wnn8wk="},
	}

	var err error
	var api *ton.APIClient
	var ctx context.Context
	var b *ton.BlockIDExt

	for _, conn := range addresses {
		err = client.AddConnection(context.Background(), conn.addr, conn.publicKey)
		log.Println(conn.addr, conn.publicKey)
		if err != nil {
			log.Println("connection err: ", err.Error())
			continue
		}
		api = ton.NewAPIClient(client)
		ctx = client.StickyContext(context.Background())
		b, err = api.CurrentMasterchainInfo(ctx)
		if err != nil {
			log.Println("get block err: ", err.Error())
			continue
		}
		addr := address.MustParseAddr("EQBAjaOyi2wGWlk-EDkSabqqnF-MrrwMadnwqrurKpkla9nE")
		res, err := api.WaitForBlock(b.SeqNo).GetAccount(ctx, b, addr)
		if err != nil {
			log.Println("get account err: ", err.Error())
			continue
		}
		if res == nil {
			log.Println("res is nil")
			continue
		}
		if res.Data != nil {
			log.Printf("Data: %s\n", res.Data.Dump())
		}
		log.Printf("Is active: %v\n", res.IsActive)
		if res.IsActive {
			log.Printf("Status: %s\n", res.State.Status)
			log.Printf("Balance: %s TON\n", res.State.Balance.TON())
		}
		break
	}
	if err != nil {
		return "", errors.New("get account err2: " + err.Error())
	}

	words := strings.Split(Mnemonic, " ")
	w, err := wallet.FromSeed(api, words, wallet.V4R2)
	if err != nil {
		return "", errors.New("助记词错误: " + err.Error())
	}
	walletAddr := w.Address()
	log.Println("wallet address:", walletAddr)

	block, err := api.CurrentMasterchainInfo(ctx)
	if err != nil {
		return "", errors.New("CurrentMasterchainInfo err: " + err.Error())
	}
	balance, err := w.GetBalance(ctx, block)
	if err != nil {
		return "", errors.New("GetBalance err: " + err.Error())
	}

	amountFloat, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return "", errors.New("amountInt err: " + err.Error())
	}
	log.Println("wallet:", fmt.Sprint(balance.TON()))

	if balance.NanoTON().Uint64() >= uint64(math.Round(amountFloat*1000000000)) {
		durationInt, err := strconv.Atoi(Duration)
		if err != nil {
			return "", errors.New("Duration 解析失败: " + err.Error())
		}

		var payAddr *address.Address
		var commentText string

		if durationInt > 30 {
			payAddr = address.MustParseAddr("UQCFJEP4WZ_mpdo0_kMEmsTgvrMHG7K_tWY16pQhKHwoOtFz") // Stars 收款地址
			commentText = fmt.Sprintf("%s Telegram Stars\n\nRef#%s", Duration, payload)
		} else {
			payAddr = address.MustParseAddr("EQBAjaOyi2wGWlk-EDkSabqqnF-MrrwMadnwqrurKpkla9nE") // Premium 地址
			commentText = fmt.Sprintf("Telegram Premium for %s months \n\nRef#%s", Duration, payload)
		}

		comment, err := wallet.CreateCommentCell(commentText)
		if err != nil {
			return "", errors.New("CreateComment err: " + err.Error())
		}
		log.Println("comment:", commentText)

		amount := tlb.MustFromTON(amount)
		log.Printf("付款地址: %s , 金额: %v\n", payAddr, amount)

		var messages []*wallet.Message
		messages = append(messages, &wallet.Message{
			Mode: 1,
			InternalMessage: &tlb.InternalMessage{
				Bounce:  false,
				DstAddr: payAddr,
				Amount:  amount,
				Body:    comment,
			},
		})

		log.Println("发送付款请求并等待区块确认中...")
		var transferErr error

		for _, conn := range addresses {
			client = liteclient.NewConnectionPool()
			err = client.AddConnection(context.Background(), conn.addr, conn.publicKey)
			if err != nil {
				log.Println("connection err: ", err.Error())
				continue
			}
			api = ton.NewAPIClient(client)
			ctx = client.StickyContext(context.Background())

			_, _, transferErr := w.SendManyWaitTransaction(ctx, messages)

			if transferErr != nil {
				log.Println("Transfer err: ", transferErr.Error())
				continue
			}
			log.Println("转账请求已发送，等待 30 秒...")
			time.Sleep(40 * time.Second)

			successInfo, err := checkForMatchingEvent(walletAddr.String(), payload)
			if err == nil {
				return successInfo, nil
			} else {
				log.Println("Event check err: ", err.Error())
			}
		}
		if transferErr != nil {
			return "", errors.New("Transfer err: " + transferErr.Error())
		}
		return "", errors.New("Transfer err: 未找到匹配事件，请手动检查结果")
	}

	notEnoughBalanceInfo := "TON余额不足: " + fmt.Sprint(balance.TON())
	return notEnoughBalanceInfo, errors.New("交易失败 ,TON余额不足")
}
