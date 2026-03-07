import { mnemonicToPrivateKey } from '@ton/crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ton: any = require('@ton/ton');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core: any = require('@ton/core');

function parseAmountToNano(amount: string | number) {
  const amountStr = String(amount).trim();
  if (!amountStr) throw new Error('amount 不能为空');
  return core.toNano(amountStr);
}

async function waitForMatchingRef(accountAddress: string, ref: string): Promise<{ txhash: string; comment: string } | null> {
  const url = `https://toncenter.com/api/v3/transactions?account=${encodeURIComponent(accountAddress)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data: any = await res.json();
  const txs: any[] = data?.transactions || [];

  for (const tx of txs) {
    const outMsgs: any[] = tx?.out_msgs || [];
    for (const out of outMsgs) {
      const comment = out?.message_content?.decoded?.comment || '';
      if (typeof comment === 'string' && comment.includes(ref)) {
        return {
          txhash: tx?.hash || '',
          comment,
        };
      }
    }
  }

  return null;
}

async function createWalletByMnemonic(mnemonic: string) {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length < 12) {
    throw new Error('助记词格式不正确');
  }

  const keyPair = await mnemonicToPrivateKey(words);
  const wallet = ton.WalletContractV4.create({
    publicKey: keyPair.publicKey,
    workchain: 0,
  });

  return { keyPair, wallet };
}

// 兼容旧接口：按月开通
export async function processTonPremium(params: {
  username: string;
  mnemonic: string;
  hash_value: string;
  cookie: string;
  months: number | string;
}) {
  const { username, mnemonic, hash_value, cookie, months } = params;

  try {
    const endpoint = process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC';
    const apiKey = process.env.TON_API_KEY || '';
    const receiver = process.env.TON_PREMIUM_RECEIVER_ADDRESS;
    const pricePerMonthStr = process.env.TON_PREMIUM_PRICE_PER_MONTH || '0.1';

    if (!receiver) {
      return {
        code: 500,
        msg: 'TON_PREMIUM_RECEIVER_ADDRESS 未配置，请在环境变量中设置 Premium 收款地址。',
      };
    }

    const monthsNum = Number(months);
    const pricePerMonth = Number(pricePerMonthStr);

    if (!Number.isFinite(monthsNum) || monthsNum <= 0) {
      return {
        code: 400,
        msg: '无效的 months 参数',
      };
    }

    if (!Number.isFinite(pricePerMonth) || pricePerMonth <= 0) {
      return {
        code: 500,
        msg: 'TON_PREMIUM_PRICE_PER_MONTH 未正确配置。',
      };
    }

    const amountTon = monthsNum * pricePerMonth;
    const { keyPair, wallet } = await createWalletByMnemonic(mnemonic);

    const client = new ton.TonClient({ endpoint, apiKey: apiKey || undefined });
    const openedWallet = client.open(wallet);

    const seqno: number = await openedWallet.getSeqno();
    const toAddress = core.Address.parse(receiver);
    const value = core.toNano(amountTon.toString());

    const commentCell = core
      .beginCell()
      .storeUint(0, 32)
      .storeStringTail(`Telegram Premium for ${monthsNum} months\n\nRef#${hash_value}`)
      .endCell();

    const transfer = await openedWallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        core.internal({
          to: toAddress,
          value,
          body: commentCell,
          bounce: false,
        }),
      ],
    });

    await openedWallet.send(transfer);
    const txhash = Buffer.from(transfer.hash()).toString('hex');

    console.log('[TON Premium] sent tx', {
      username,
      months: monthsNum,
      hash_value,
      cookie_length: cookie?.length || 0,
      endpoint,
      receiver,
      amountTon,
      txhash,
    });

    return {
      code: 200,
      msg: 'success',
      data: {
        txhash,
        username,
        months: monthsNum,
        amountTon,
        receiver,
      },
    };
  } catch (error: any) {
    console.error('[TON Premium] error', error);
    return {
      code: 500,
      msg: error.message || '处理失败',
    };
  }
}

// 融合 main.go 核心流程：按 amount + payload + duration 执行并校验 Ref
export async function processTonPremiumGift(params: {
  amount: string | number;
  payload: string;
  duration: number | string;
  mnemonic?: string;
}) {
  try {
    const endpoint = process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC';
    const apiKey = process.env.TON_API_KEY || '';

    const durationNum = Number(params.duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      return { code: 400, msg: '无效的 duration 参数' };
    }

    const payload = String(params.payload || '').trim();
    if (!payload) {
      return { code: 400, msg: 'payload 不能为空' };
    }

    const mnemonic = (params.mnemonic || process.env.WalletMnemonic || '').trim();
    if (!mnemonic) {
      return { code: 500, msg: '未提供助记词（mnemonic / WalletMnemonic）' };
    }

    const premiumReceiver = process.env.TON_PREMIUM_RECEIVER_ADDRESS || 'EQBAjaOyi2wGWlk-EDkSabqqnF-MrrwMadnwqrurKpkla9nE';
    const starsReceiver = process.env.TON_STARS_RECEIVER_ADDRESS || 'UQCFJEP4WZ_mpdo0_kMEmsTgvrMHG7K_tWY16pQhKHwoOtFz';

    const receiver = durationNum > 30 ? starsReceiver : premiumReceiver;
    const commentText =
      durationNum > 30
        ? `${durationNum} Telegram Stars\n\nRef#${payload}`
        : `Telegram Premium for ${durationNum} months\n\nRef#${payload}`;

    const { keyPair, wallet } = await createWalletByMnemonic(mnemonic);
    const client = new ton.TonClient({ endpoint, apiKey: apiKey || undefined });
    const openedWallet = client.open(wallet);

    const seqno: number = await openedWallet.getSeqno();
    const walletAddress = openedWallet.address.toString();

    const commentCell = core.beginCell().storeUint(0, 32).storeStringTail(commentText).endCell();

    const transfer = await openedWallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        core.internal({
          to: core.Address.parse(receiver),
          value: parseAmountToNano(params.amount),
          body: commentCell,
          bounce: false,
        }),
      ],
    });

    await openedWallet.send(transfer);
    const txhash = Buffer.from(transfer.hash()).toString('hex');

    await new Promise((r) => setTimeout(r, 15000));
    const matched = await waitForMatchingRef(walletAddress, payload);

    return {
      code: 200,
      msg: matched ? '交易已上链并匹配到 Ref' : '交易已发送，链上确认稍有延迟',
      data: {
        txhash,
        matchedTxHash: matched?.txhash || null,
        payload,
        duration: durationNum,
        receiver,
        walletAddress,
      },
    };
  } catch (error: any) {
    console.error('[TON Premium Gift] error', error);
    return {
      code: 500,
      msg: error.message || '处理失败',
    };
  }
}
