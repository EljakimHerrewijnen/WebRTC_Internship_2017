using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WebRTC_Internship.Models;
using System.Linq;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace WebRTC_Internship.Controllers
{
    [RequireHttps]
    [Route("api/[controller]/")]
    public class VideochatController : Controller
    {
        // GET: api/videochat
        [HttpGet]
        public IActionResult Videochat()
        {
            return View();
        }

        [HttpGet("start_chat")]
        public IActionResult Start_chat()
        {
            while (true)
            {
                string uuid = Guid.NewGuid().ToString();
                break;
                //foreach(var chat in )                {                }
            }
            return this.Ok(new Models.Videochat { UUID = "123", Start = DateTime.Now, End = DateTime.Now });
        }

        [RequireHttps]
        [HttpGet("{uuid}")]
        //GET api/videochat/5
        //public string getuuid(int uuid)
        //{
        //    return uuid.ToString();
        //}
        public IActionResult Join_chat(string uuid)
        {
            return View();
        }
        

        // POST api/videochat
        [HttpPost]
        public void Post([FromBody]string value)
        {
        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
